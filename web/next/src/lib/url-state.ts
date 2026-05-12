"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";

type UrlParamValue = string | number | boolean | null | undefined;

interface NumberParamOptions {
  min?: number;
  max?: number;
}

export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceParams = useCallback(
    (updates: Record<string, UrlParamValue>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: UrlParamValue) => {
      replaceParams({ [key]: value });
    },
    [replaceParams],
  );

  return {
    searchParams,
    setParam,
    setParams: replaceParams,
  };
}

export function readNumberParam(
  params: URLSearchParams | ReadonlyURLSearchParams,
  key: string,
  fallback: number,
  options: NumberParamOptions = {},
): number {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;

  const { min, max } = options;
  if (typeof min === "number" && parsed < min) return min;
  if (typeof max === "number" && parsed > max) return max;

  return parsed;
}
