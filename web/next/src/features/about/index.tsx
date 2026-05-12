"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { getAboutContent } from "./api";

export function AboutPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAboutContent().then((res) => {
      if (res.data) setContent(res.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("nav.about")}</h1>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : content ? (
          <article className="prose prose-invert max-w-none prose-headings:text-[var(--foreground)] prose-p:text-[var(--muted)] prose-a:text-[var(--accent)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        ) : (
          <p className="text-[var(--muted)]">{t("common.noData")}</p>
        )}
      </div>
    </PublicLayout>
  );
}
