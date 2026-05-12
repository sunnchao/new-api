"use client";

import { useEffect, useState } from "react";
import i18next from "i18next";
import { toast } from "sonner";
import { getHomePageContent } from "../api";
import type { HomePageContentResult } from "../types";

const STORAGE_KEY = "home_page_content";

export function useHomePageContent(): HomePageContentResult {
  const [content, setContent] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      if (cached && mounted) setContent(cached);

      try {
        const response = await getHomePageContent();
        if (!mounted) return;

        if (response.success && response.data) {
          setContent(response.data);
          window.localStorage.setItem(STORAGE_KEY, response.data);
        } else {
          setContent("");
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to load home page content:", error);
        toast.error(i18next.t("home.loadContentFailed"));
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, []);

  let isUrl = false;
  try {
    const url = new URL(content);
    isUrl = url.protocol === "http:" || url.protocol === "https:";
  } catch {
    // Content is Markdown/HTML, not a URL.
  }

  return { content, isLoaded, isUrl };
}
