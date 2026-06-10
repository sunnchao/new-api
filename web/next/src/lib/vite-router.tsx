import {
  Component,
  Suspense,
  use,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AppLayout from "@/app/(app)/layout";
import SystemSettingsLayout from "@/app/(app)/system-settings/layout";
import NotFoundPage from "@/app/not-found";
import {
  isNotFoundError,
  isRedirectError,
  RouteParamsProvider,
  useRouter,
  useViteLocation,
  type ViteRouteParams,
} from "@/lib/vite-router-context";

type SearchRecord = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<ViteRouteParams>;
  searchParams: Promise<SearchRecord>;
};

type PageComponent = (props: PageProps) => ReactNode | Promise<ReactNode>;
type PageModule = { default: PageComponent };

type RouteRecord = {
  id: string;
  pathname: string;
  paramNames: string[];
  pattern: RegExp;
  score: number;
  protectedRoute: boolean;
  systemSettingsRoute: boolean;
  load: () => Promise<PageModule>;
};

type RouteMatch = {
  route: RouteRecord;
  params: ViteRouteParams;
};

type LegacyRedirect = {
  source: string;
  destination: string;
};

const pageModules = import.meta.glob<PageModule>("../app/**/page.tsx");

const legacyRedirects: LegacyRedirect[] = [
  { source: "/forbidden", destination: "/403" },
  { source: "/login", destination: "/sign-in" },
  { source: "/register", destination: "/sign-up" },
  { source: "/console", destination: "/dashboard" },
  { source: "/console/models", destination: "/models" },
  { source: "/console/deployment", destination: "/models/deployments" },
  { source: "/console/health", destination: "/health" },
  { source: "/console/subscription", destination: "/subscriptions" },
  {
    source: "/console/subscription-overview",
    destination: "/subscriptions?tab=all-subscriptions",
  },
  { source: "/console/channel", destination: "/channels" },
  { source: "/console/token", destination: "/keys" },
  { source: "/console/admin/token", destination: "/admin-tokens" },
  { source: "/console/playground", destination: "/playground" },
  { source: "/console/redemption", destination: "/redemption-codes" },
  { source: "/console/tickets", destination: "/tickets?legacy_admin=1" },
  { source: "/console/ticket/:id", destination: "/tickets/:id?legacy_admin=1" },
  { source: "/console/user", destination: "/users" },
  { source: "/console/personal", destination: "/profile" },
  { source: "/console/subscriptions", destination: "/my-subscriptions" },
  { source: "/console/packages", destination: "/admin-packages" },
  { source: "/console/midjourney", destination: "/usage-logs/drawing" },
  { source: "/console/task", destination: "/usage-logs/task" },
  { source: "/console/chat", destination: "/chat/new" },
  { source: "/console/chat/:id", destination: "/chat/:id" },
  { source: "/ticket/:id", destination: "/tickets/:id" },
  { source: "/vibecoding/claude/admin", destination: "/vibecoding/admin" },
  { source: "/openclaw", destination: "/vibecoding/openclaw" },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRoutePath(filePath: string) {
  const withoutPrefix = filePath.replace(/^\.\.\/app/, "").replace(/\/page\.tsx$/, "");
  const segments = withoutPrefix
    .split("/")
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));

  if (segments.length === 0) return "/";

  return `/${segments
    .map((segment) => {
      const dynamicMatch = segment.match(/^\[(.+)]$/);
      return dynamicMatch ? `:${dynamicMatch[1]}` : segment;
    })
    .join("/")}`;
}

function compilePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const paramNames: string[] = [];
  let score = segments.length === 0 ? 1 : 0;

  const patternSegments = segments.map((segment) => {
    if (segment.startsWith(":")) {
      paramNames.push(segment.slice(1));
      score += 2;
      return "([^/]+)";
    }
    score += 4;
    return escapeRegExp(segment);
  });

  const pattern =
    patternSegments.length === 0
      ? /^\/?$/
      : new RegExp(`^/${patternSegments.join("/")}/?$`);

  return { pattern, paramNames, score };
}

function createRoutes(): RouteRecord[] {
  return Object.entries(pageModules)
    .map(([id, load]) => {
      const pathname = normalizeRoutePath(id);
      const { pattern, paramNames, score } = compilePath(pathname);
      const protectedRoute = id.includes("/(app)/");
      const systemSettingsRoute =
        pathname === "/system-settings" || pathname.startsWith("/system-settings/");

      return {
        id,
        pathname,
        paramNames,
        pattern,
        score,
        protectedRoute,
        systemSettingsRoute,
        load,
      };
    })
    .sort((a, b) => b.score - a.score || b.pathname.length - a.pathname.length);
}

const routes = createRoutes();

function matchRoute(pathname: string): RouteMatch | null {
  for (const route of routes) {
    const match = route.pattern.exec(pathname);
    if (!match) continue;

    const params = route.paramNames.reduce<ViteRouteParams>((acc, name, index) => {
      acc[name] = decodeURIComponent(match[index + 1] ?? "");
      return acc;
    }, {});

    return { route, params };
  }

  return null;
}

function searchParamsToRecord(search: string): SearchRecord {
  const searchParams = new URLSearchParams(search);
  const record: SearchRecord = {};

  searchParams.forEach((_value, key) => {
    if (Object.prototype.hasOwnProperty.call(record, key)) return;
    const values = searchParams.getAll(key);
    record[key] = values.length > 1 ? values : values[0] ?? "";
  });

  return record;
}

function applyParams(destination: string, params: ViteRouteParams) {
  return destination.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];
    return encodeURIComponent(Array.isArray(value) ? value[0] ?? "" : value ?? "");
  });
}

function mergeSearch(destination: string, currentSearch: string) {
  const target = new URL(destination, "http://local.invalid");
  const current = new URLSearchParams(currentSearch);

  current.forEach((value, key) => {
    if (!target.searchParams.has(key)) {
      target.searchParams.append(key, value);
    }
  });

  const query = target.searchParams.toString();
  return `${target.pathname}${query ? `?${query}` : ""}${target.hash}`;
}

function resolveLegacyRedirect(pathname: string, search: string) {
  for (const redirect of legacyRedirects) {
    const { pattern, paramNames } = compilePath(redirect.source);
    const match = pattern.exec(pathname);
    if (!match) continue;

    const params = paramNames.reduce<ViteRouteParams>((acc, name, index) => {
      acc[name] = decodeURIComponent(match[index + 1] ?? "");
      return acc;
    }, {});
    const destination = mergeSearch(applyParams(redirect.destination, params), search);

    return destination === `${pathname}${search}` ? null : destination;
  }

  return null;
}

function RouteLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-sm text-[var(--muted)]">
      Loading...
    </div>
  );
}

function PageRenderer({
  Component: Page,
  params,
  search,
}: {
  Component: PageComponent;
  params: ViteRouteParams;
  search: string;
}) {
  const props = useMemo<PageProps>(
    () => ({
      params: Promise.resolve(params),
      searchParams: Promise.resolve(searchParamsToRecord(search)),
    }),
    [params, search]
  );

  if (Page.constructor.name === "AsyncFunction") {
    return use(Page(props) as Promise<ReactNode>);
  }

  return <Page {...props} />;
}

function PageLoader({
  match,
  search,
}: {
  match: RouteMatch;
  search: string;
}) {
  const [loaded, setLoaded] = useState<{
    routeId: string;
    module: PageModule;
  } | null>(null);

  useEffect(() => {
    let active = true;
    match.route.load().then((loaded) => {
      if (active) {
        setLoaded({ routeId: match.route.id, module: loaded });
      }
    });

    return () => {
      active = false;
    };
  }, [match.route]);

  if (loaded?.routeId !== match.route.id) return <RouteLoading />;

  return (
    <PageRenderer
      Component={loaded.module.default}
      params={match.params}
      search={search}
    />
  );
}

function RedirectHandler({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href, { scroll: false });
  }, [href, router]);

  return null;
}

class RouteErrorBoundary extends Component<
  {
    resetKey: string;
    children: ReactNode;
  },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidUpdate(previousProps: { resetKey: string }) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      if (isRedirectError(this.state.error)) {
        return <RedirectHandler href={this.state.error.href} />;
      }

      if (isNotFoundError(this.state.error)) {
        return <NotFoundPage />;
      }

      throw this.state.error;
    }

    return this.props.children;
  }
}

function RouteContent({ match, search }: { match: RouteMatch; search: string }) {
  const page = (
    <Suspense fallback={<RouteLoading />}>
      <RouteParamsProvider params={match.params}>
        <PageLoader match={match} search={search} />
      </RouteParamsProvider>
    </Suspense>
  );

  if (match.route.systemSettingsRoute) {
    return (
      <AppLayout>
        <SystemSettingsLayout>{page}</SystemSettingsLayout>
      </AppLayout>
    );
  }

  if (match.route.protectedRoute) {
    return <AppLayout>{page}</AppLayout>;
  }

  return page;
}

export function AppRouter() {
  const location = useViteLocation();
  const router = useRouter();
  const legacyRedirect = resolveLegacyRedirect(location.pathname, location.search);
  const match = matchRoute(location.pathname);
  const resetKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (legacyRedirect) {
      router.replace(legacyRedirect, { scroll: false });
    }
  }, [legacyRedirect, router]);

  if (legacyRedirect) return null;

  return (
    <RouteErrorBoundary resetKey={resetKey}>
      {match ? (
        <RouteContent match={match} search={location.search} />
      ) : (
        <NotFoundPage />
      )}
    </RouteErrorBoundary>
  );
}
