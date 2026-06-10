"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileWarning } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/layout/public-layout";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LegalDocumentResponse } from "./types";

interface LegalDocumentProps {
  titleKey: string;
  queryKey: string;
  fetchDocument: () => Promise<LegalDocumentResponse>;
  emptyMessageKey: string;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function LegalDocument({
  titleKey,
  queryKey,
  fetchDocument,
  emptyMessageKey,
}: LegalDocumentProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchDocument,
    staleTime: 10 * 60 * 1000,
  });

  const title = t(titleKey);
  const content = data?.data?.trim() ?? "";
  const hasContent = content.length > 0;
  const success = data?.success ?? false;
  const isUrl = hasContent && isValidHttpUrl(content);
  const isHtml = hasContent && !isUrl && isLikelyHtml(content);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">{title}</h1>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !success || !hasContent ? (
          <Card className="border-dashed">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-[var(--surface)] p-2">
                <FileWarning className="h-5 w-5 text-[var(--muted)]" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="text-sm text-[var(--muted)]">
                  {data?.message || t(emptyMessageKey)}
                </p>
              </div>
            </CardHeader>
          </Card>
        ) : isUrl ? (
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--muted)]">{t("legal.externalDocument")}</p>
              <a
                href={content}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                <ExternalLink className="h-4 w-4" />
                {t("legal.viewDocument")}
              </a>
            </CardContent>
          </Card>
        ) : isHtml ? (
          <article
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <article className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
