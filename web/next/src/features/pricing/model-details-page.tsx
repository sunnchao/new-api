"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { getPricing } from "./api";
import type { PricingModel } from "./types";

export function ModelDetailsPage({ modelId }: { modelId: string }) {
  const { t } = useTranslation();
  const [model, setModel] = useState<PricingModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPricing().then((res) => {
      const list = res.data || [];
      const found = list.find((m) => m.model_name === decodeURIComponent(modelId));
      if (found) setModel(found);
    }).finally(() => setLoading(false));
  }, [modelId]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !model ? (
          <div className="text-center py-16 text-[var(--muted)]">
            {t("pricing.modelNotFound")}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-mono text-3xl font-bold">{model.model_name}</h1>
                {model.group && <Badge variant="secondary">{model.group}</Badge>}
              </div>
              {model.description && (
                <p className="text-[var(--muted)] text-pretty">{model.description}</p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("pricing.title")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {model.prompt_ratio != null && (
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.promptPrice")}</div>
                    <div className="font-mono text-lg font-semibold">{model.prompt_ratio}</div>
                  </div>
                )}
                {model.completion_ratio != null && (
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.completionPrice")}</div>
                    <div className="font-mono text-lg font-semibold">{model.completion_ratio}</div>
                  </div>
                )}
                {model.cache_ratio != null && (
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.cachePrice")}</div>
                    <div className="font-mono text-lg font-semibold">{model.cache_ratio}</div>
                  </div>
                )}
                {model.image_ratio != null && (
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.imagePrice")}</div>
                    <div className="font-mono text-lg font-semibold">{model.image_ratio}</div>
                  </div>
                )}
                {model.audio_ratio != null && (
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.audioPrice")}</div>
                    <div className="font-mono text-lg font-semibold">{model.audio_ratio}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(model.context_length || model.max_tokens) && (
              <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("pricing.specifications")}</CardTitle>
              </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {model.context_length && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.contextLength")}</div>
                      <div className="font-mono text-lg font-semibold">{model.context_length.toLocaleString()}</div>
                    </div>
                  )}
                  {model.max_tokens && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-1">{t("pricing.maxOutput")}</div>
                      <div className="font-mono text-lg font-semibold">{model.max_tokens.toLocaleString()}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {model.capabilities && model.capabilities.length > 0 && (
              <Card>
              <CardHeader>
                  <CardTitle className="text-base">{t("pricing.capabilities")}</CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline">{cap}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
