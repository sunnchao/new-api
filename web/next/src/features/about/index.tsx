"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Skeleton } from "@/components/ui/skeleton";
import { Construction } from "lucide-react";
import { getAboutContent } from "./api";

function isValidUrl(v: string) {
  try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}
function isLikelyHtml(v: string) { return /<\/?[a-z][\s\S]*>/i.test(v); }

export function AboutPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAboutContent().then((res) => { if (res.data) setContent(res.data.trim()); }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-4 py-12 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </PublicLayout>
    );
  }

  if (!content) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="max-w-2xl space-y-6 text-center">
            <Construction className="h-20 w-20 mx-auto text-[var(--muted)]" />
            <h2 className="text-2xl font-bold">{t("about.noContent", { defaultValue: "No About Content Set" })}</h2>
            <p className="text-[var(--muted)]">{t("about.noContentDesc", { defaultValue: "The administrator has not configured any about content yet." })}</p>
            <div className="text-sm space-y-2 text-[var(--muted)]">
              <p>
                <a href="https://github.com/QuantumNous/new-api" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                  New API
                </a>{" "}
                © {new Date().getFullYear()}{" "}
                <a href="https://github.com/QuantumNous" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">QuantumNous</a>
              </p>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (isValidUrl(content)) {
    return (
      <PublicLayout>
        <iframe src={content} className="h-[calc(100vh-3.5rem)] w-full border-0" title={t("nav.about")} />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        {isLikelyHtml(content) ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
