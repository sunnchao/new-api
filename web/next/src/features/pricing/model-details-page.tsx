"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Type,
  Image,
  Mic,
  Video,
  FileText,
  Zap,
  Brain,
  Eye,
  Code2,
  Globe,
  Database,
  Wrench,
  Shield,
  Search,
  Hash,
  Layers,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { getPricing } from "./api";
import type { PricingModel, Modality, ModelCapability } from "./types";

const MODALITY_META: Record<
  Modality,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  text: { icon: Type, label: "Text" },
  image: { icon: Image, label: "Image" },
  audio: { icon: Mic, label: "Audio" },
  video: { icon: Video, label: "Video" },
  file: { icon: FileText, label: "File" },
};

const CAPABILITY_META: Partial<
  Record<
    ModelCapability,
    { icon: React.ComponentType<{ className?: string }>; label: string }
  >
> = {
  function_calling: { icon: Wrench, label: "Function Calling" },
  streaming: { icon: Zap, label: "Streaming" },
  vision: { icon: Eye, label: "Vision" },
  json_mode: { icon: Hash, label: "JSON Mode" },
  structured_output: { icon: Layers, label: "Structured Output" },
  reasoning: { icon: Brain, label: "Reasoning" },
  tools: { icon: Wrench, label: "Tools" },
  web_search: { icon: Globe, label: "Web Search" },
  caching: { icon: Database, label: "Caching" },
  embeddings: { icon: Database, label: "Embeddings" },
  code_interpreter: { icon: Code2, label: "Code Interpreter" },
  system_prompt: { icon: Shield, label: "System Prompt" },
};

const CONTEXT_MAX = 2000000;

export function ModelDetailsPage({ modelId }: { modelId: string }) {
  const { t } = useTranslation();
  const [model, setModel] = useState<PricingModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPricing()
      .then((res) => {
        const found = res.data?.find(
          (m) => m.model_name === decodeURIComponent(modelId)
        );
        if (found) setModel(found);
      })
      .finally(() => setLoading(false));
  }, [modelId]);

  const formatPrice = (ratio: number) => {
    if (ratio === 0) return "Free";
    const val = (ratio * 2) / 1000000;
    if (val < 0.01) return `$${val.toFixed(5)}`;
    if (val < 1) return `$${val.toFixed(4)}`;
    return `$${val.toFixed(2)}`;
  };

  const formatPerToken = (ratio: number) => {
    if (ratio === 0) return "Free";
    const per1M = (ratio * 2) / 1000000;
    return `$${per1M.toFixed(6)}`;
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--muted)] mb-8">
          <Link
            href="/pricing"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            {t("pricing.title")}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--foreground)] truncate max-w-[200px]">
            {loading ? "…" : model?.model_name ?? modelId}
          </span>
        </nav>

        {loading ? (
          <DetailsSkeleton />
        ) : !model ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-[var(--muted)]" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {t("pricing.modelNotFound")}
            </h3>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="mt-3">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                {t("common.back")}
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Hero header */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <h1 className="font-mono text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                  {model.model_name}
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {model.vendor_name && (
                  <Badge variant="secondary">{model.vendor_name}</Badge>
                )}
                {model.quota_type === 1 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 text-amber-600 dark:text-amber-400"
                  >
                    Per Request
                  </Badge>
                )}
                {model.billing_mode && (
                  <Badge variant="outline" className="text-[var(--muted)]">
                    {model.billing_mode}
                  </Badge>
                )}
              </div>
              {model.description && (
                <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
                  {model.description}
                </p>
              )}
            </div>

            {/* Quick stats row */}
            {(model.context_length ||
              model.max_output_tokens ||
              model.knowledge_cutoff ||
              model.parameter_count) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {model.context_length && (
                  <StatCard
                    label={t("pricing.contextLength", {
                      defaultValue: "Context",
                    })}
                    value={model.context_length.toLocaleString()}
                    sub="tokens"
                  />
                )}
                {model.max_output_tokens && (
                  <StatCard
                    label={t("pricing.maxOutput", {
                      defaultValue: "Max Output",
                    })}
                    value={model.max_output_tokens.toLocaleString()}
                    sub="tokens"
                  />
                )}
                {model.knowledge_cutoff && (
                  <StatCard
                    label="Knowledge"
                    value={model.knowledge_cutoff}
                  />
                )}
                {model.parameter_count && (
                  <StatCard
                    label="Parameters"
                    value={model.parameter_count}
                  />
                )}
              </div>
            )}

            {/* Pricing card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("pricing.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <PriceBlock
                    label={t("pricing.promptPrice", {
                      defaultValue: "Input",
                    })}
                    price={formatPrice(model.model_ratio)}
                    perToken={formatPerToken(model.model_ratio)}
                  />
                  <PriceBlock
                    label={t("pricing.completionPrice", {
                      defaultValue: "Output",
                    })}
                    price={formatPrice(
                      model.model_ratio * model.completion_ratio
                    )}
                    perToken={formatPerToken(
                      model.model_ratio * model.completion_ratio
                    )}
                  />
                  {model.cache_ratio != null && model.cache_ratio !== 0 && (
                    <PriceBlock
                      label={t("pricing.cachePrice", {
                        defaultValue: "Cache Read",
                      })}
                      price={formatPrice(
                        model.model_ratio * model.cache_ratio
                      )}
                      perToken={formatPerToken(
                        model.model_ratio * model.cache_ratio
                      )}
                    />
                  )}
                  {model.create_cache_ratio != null &&
                    model.create_cache_ratio !== 0 && (
                      <PriceBlock
                        label="Cache Write"
                        price={formatPrice(
                          model.model_ratio * model.create_cache_ratio
                        )}
                        perToken={formatPerToken(
                          model.model_ratio * model.create_cache_ratio
                        )}
                      />
                    )}
                  {model.image_ratio != null && (
                    <PriceBlock
                      label={t("pricing.imagePrice", {
                        defaultValue: "Image",
                      })}
                      price={String(model.image_ratio)}
                      perToken="per image"
                    />
                  )}
                  {model.audio_ratio != null && (
                    <PriceBlock
                      label={t("pricing.audioPrice", {
                        defaultValue: "Audio",
                      })}
                      price={formatPrice(
                        model.model_ratio * model.audio_ratio
                      )}
                      perToken={formatPerToken(
                        model.model_ratio * model.audio_ratio
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Context length progress bar */}
            {model.context_length && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("pricing.specifications", {
                      defaultValue: "Specifications",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--muted)]">
                        {t("pricing.contextLength", {
                          defaultValue: "Context Length",
                        })}
                      </span>
                      <span className="font-mono font-medium">
                        {model.context_length.toLocaleString()} tokens
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/70 transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (model.context_length / CONTEXT_MAX) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  {model.max_output_tokens && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[var(--muted)]">
                          {t("pricing.maxOutput", {
                            defaultValue: "Max Output",
                          })}
                        </span>
                        <span className="font-mono font-medium">
                          {model.max_output_tokens.toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-500/70 transition-all duration-700"
                          style={{
                            width: `${Math.min(100, (model.max_output_tokens / (model.context_length ?? CONTEXT_MAX)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Modalities */}
            {model.input_modalities &&
              model.input_modalities.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Modalities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {model.input_modalities.map((m) => {
                        const meta = MODALITY_META[m];
                        if (!meta) return null;
                        const Icon = meta.icon;
                        const hasOutput =
                          model.output_modalities?.includes(m) ?? false;
                        return (
                          <div
                            key={m}
                            className="flex items-center gap-2.5 rounded-lg border border-[var(--border)]/60 p-3"
                          >
                            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-medium">
                                {meta.label}
                              </div>
                              <div className="text-[10px] text-[var(--muted)]">
                                {hasOutput ? "Input & Output" : "Input only"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Capabilities */}
            {model.capabilities && model.capabilities.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("pricing.capabilities", {
                      defaultValue: "Capabilities",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.capabilities.map((cap) => {
                      const meta = CAPABILITY_META[cap];
                      const Icon = meta?.icon ?? Zap;
                      return (
                        <div
                          key={cap}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)]/60 bg-[var(--surface)]/30 px-3 py-2 text-xs font-medium"
                        >
                          <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                          {meta?.label ?? cap}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available groups */}
            {model.enable_groups && model.enable_groups.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("pricing.groups", {
                      defaultValue: "Available Groups",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.enable_groups.map((g, i) => {
                      const hue = (i * 47 + 200) % 360;
                      return (
                        <span
                          key={g}
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border"
                          style={{
                            backgroundColor: `hsla(${hue}, 50%, 50%, 0.08)`,
                            borderColor: `hsla(${hue}, 50%, 50%, 0.25)`,
                            color: `hsl(${hue}, 50%, 50%)`,
                          }}
                        >
                          {g}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Supported endpoints */}
            {model.supported_endpoint_types &&
              model.supported_endpoint_types.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Supported Endpoints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {model.supported_endpoint_types.map((ep) => (
                        <Badge key={ep} variant="outline" className="font-mono text-[10px]">
                          {ep}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </motion.div>
        )}
      </div>
    </PublicLayout>
  );
}

/* ──────────── Sub-components ──────────── */

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">
        {label}
      </div>
      <div className="font-mono text-sm font-semibold text-[var(--foreground)]">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function PriceBlock({
  label,
  price,
  perToken,
}: {
  label: string;
  price: string;
  perToken: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)]/40 bg-[var(--surface)]/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1.5">
        {label}
      </div>
      <div className="font-mono text-base font-semibold text-[var(--foreground)]">
        {price}
      </div>
      <div className="text-[10px] text-[var(--muted)] mt-0.5">{perToken}/tok</div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
