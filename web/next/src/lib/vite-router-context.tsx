/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const NAVIGATION_EVENT = "new-api-vite-navigation";

export type ViteRouteParams = Record<string, string | string[]>;

export type NavigateOptions = {
  scroll?: boolean;
};

export type ViteRouter = {
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: () => Promise<void>;
};

export type ViteLocation = {
  pathname: string;
  search: string;
  hash: string;
};

type RouterContextValue = {
  location: ViteLocation;
  router: ViteRouter;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const RouteParamsContext = createContext<ViteRouteParams>({});

export class ViteRedirectError extends Error {
  readonly digest = "NEXT_REDIRECT";

  constructor(readonly href: string) {
    super(`Redirect to ${href}`);
  }
}

export class ViteNotFoundError extends Error {
  readonly digest = "NEXT_NOT_FOUND";

  constructor() {
    super("Route not found");
  }
}

export function redirect(href: string): never {
  throw new ViteRedirectError(href);
}

export function notFound(): never {
  throw new ViteNotFoundError();
}

export function isRedirectError(error: unknown): error is ViteRedirectError {
  return error instanceof ViteRedirectError;
}

export function isNotFoundError(error: unknown): error is ViteNotFoundError {
  return error instanceof ViteNotFoundError;
}

function getLocationSnapshot(): ViteLocation {
  if (typeof window === "undefined") {
    return { pathname: "/", search: "", hash: "" };
  }

  return {
    pathname: window.location.pathname || "/",
    search: window.location.search,
    hash: window.location.hash,
  };
}

export function normalizeHref(href: string): string {
  if (typeof window === "undefined") return href;
  const url = new URL(href, window.location.href);
  return `${url.pathname}${url.search}${url.hash}`;
}

function navigate(href: string, replace: boolean, options?: NavigateOptions) {
  if (typeof window === "undefined") return;

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    if (replace) window.location.replace(url.href);
    else window.location.assign(url.href);
    return;
  }

  const nextHref = `${url.pathname}${url.search}${url.hash}`;
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextHref !== currentHref) {
    if (replace) window.history.replaceState({}, "", nextHref);
    else window.history.pushState({}, "", nextHref);
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
  }

  if (options?.scroll !== false) {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }
}

export function ViteRouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(getLocationSnapshot);

  useEffect(() => {
    const updateLocation = () => setLocation(getLocationSnapshot());

    window.addEventListener("popstate", updateLocation);
    window.addEventListener(NAVIGATION_EVENT, updateLocation);

    return () => {
      window.removeEventListener("popstate", updateLocation);
      window.removeEventListener(NAVIGATION_EVENT, updateLocation);
    };
  }, []);

  const push = useCallback((href: string, options?: NavigateOptions) => {
    navigate(href, false, options);
  }, []);

  const replace = useCallback((href: string, options?: NavigateOptions) => {
    navigate(href, true, options);
  }, []);

  const router = useMemo<ViteRouter>(
    () => ({
      push,
      replace,
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => setLocation(getLocationSnapshot()),
      prefetch: async () => {},
    }),
    [push, replace]
  );

  return (
    <RouterContext.Provider value={{ location, router }}>
      {children}
    </RouterContext.Provider>
  );
}

export function RouteParamsProvider({
  params,
  children,
}: {
  params: ViteRouteParams;
  children: ReactNode;
}) {
  return (
    <RouteParamsContext.Provider value={params}>
      {children}
    </RouteParamsContext.Provider>
  );
}

function useRouterContext() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("Vite router hooks must be used inside ViteRouterProvider");
  }
  return context;
}

export function useViteLocation() {
  return useRouterContext().location;
}

export function useRouter() {
  return useRouterContext().router;
}

export function usePathname() {
  return useRouterContext().location.pathname;
}

export function useSearchParams() {
  const { search } = useRouterContext().location;
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends ViteRouteParams = ViteRouteParams>() {
  return useContext(RouteParamsContext) as T;
}

export type ReadonlyURLSearchParams = URLSearchParams;
