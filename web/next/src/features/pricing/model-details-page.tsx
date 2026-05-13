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
      const found = res.data?.find((m) => m.model_name === decodeURIComponent(modelId));
      if (found) setModel(found);
    }).finally(() => setLoading(false));
  }, [modelId]);

  const formatPrice = (ratio: number) => `$${((ratio * 2) / 1000000).toFixed(4)}/1M`;

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
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !model ? (
          <div className="text-center py-16 text-[var(--muted)]">{t("pricing.modelNotFound")}</div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-mono text-3xl font-bold">{model.model_name}</h1>
                {model.vendor_name && <Badge variant="secondary">{model.vendor_name}</Badge>}
                {model.quota_type === 1 && <Badge variant="outline">Per Request</Badge>}
              </div>
              {model.description && <p className="text-[var(--muted)] text-pretty">{model.description}</p>}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("pricing.title")}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <PriceItem label={t("pricing.promptPrice", { defaultValue: "Input" })} value={formatPrice(model.model_ratio)} />
                <PriceItem label={t("pricing.completionPrice", { defaultValue: "Output" })} value={formatPrice(model.model_ratio * model.completion_ratio)} />
                {model.cache_ratio != null && <PriceItem label={t("pricing.cachePrice", { defaultValue: "Cache" })} value={formatPrice(model.model_ratio * model.cache_ratio)} />}
                {model.image_ratio != null && <PriceItem label={t("pricing.imagePrice", { defaultValue: "Image" })} value={String(model.image_ratio)} />}
                {model.audio_ratio != null && <PriceItem label={t("pricing.audioPrice", { defaultValue: "Audio" })} value={String(model.audio_ratio)} />}
              </CardContent>
            </Card>

            {(model.context_length || model.max_output_tokens) && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t("pricing.specifications", { defaultValue: "Specifications" })}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {model.context_length && <PriceItem label={t("pricing.contextLength", { defaultValue: "Context Length" })} value={model.context_length.toLocaleString()} />}
                  {model.max_output_tokens && <PriceItem label={t("pricing.maxOutput", { defaultValue: "Max Output" })} value={model.max_output_tokens.toLocaleString()} />}
                </CardContent>
              </Card>
            )}

            {model.capabilities && model.capabilities.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t("pricing.capabilities", { defaultValue: "Capabilities" })}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.capabilities.map((cap) => <Badge key={cap} variant="outline">{cap}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {model.enable_groups && model.enable_groups.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t("pricing.groups", { defaultValue: "Available Groups" })}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.enable_groups.map((g) => <Badge key={g} variant="secondary">{g}</Badge>)}
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

function PriceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--muted)] mb-1">{label}</div>
      <div className="font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
