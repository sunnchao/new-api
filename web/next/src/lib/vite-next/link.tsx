import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";
import { useRouter } from "@/lib/vite-router-context";

type HrefObject = {
  pathname?: string;
  query?: Record<
    string,
    string | number | boolean | null | undefined | Array<string | number | boolean>
  >;
  hash?: string;
};

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | URL | HrefObject;
  as?: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  locale?: string | false;
  legacyBehavior?: boolean;
  passHref?: boolean;
};

function formatHref(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (href instanceof URL) return href.toString();

  const pathname = href.pathname ?? "";
  const params = new URLSearchParams();

  Object.entries(href.query ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    params.set(key, String(value));
  });

  const query = params.toString();
  const hash = href.hash ? (href.hash.startsWith("#") ? href.hash : `#${href.hash}`) : "";
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function isLocalHref(href: string) {
  if (typeof window === "undefined") return href.startsWith("/");
  const url = new URL(href, window.location.href);
  return url.origin === window.location.origin;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    as,
    replace,
    scroll,
    prefetch,
    locale,
    legacyBehavior,
    passHref,
    onClick,
    target,
    download,
    ...props
  },
  ref
) {
  const router = useRouter();
  const resolvedHref = formatHref(href);
  void as;
  void prefetch;
  void locale;
  void legacyBehavior;
  void passHref;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      isModifiedEvent(event) ||
      download ||
      (target && target !== "_self") ||
      !isLocalHref(resolvedHref)
    ) {
      return;
    }

    event.preventDefault();
    if (replace) router.replace(resolvedHref, { scroll });
    else router.push(resolvedHref, { scroll });
  }

  return (
    <a
      ref={ref}
      href={resolvedHref}
      target={target}
      download={download}
      onClick={handleClick}
      {...props}
    />
  );
});

export default Link;
