"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useHomePageContent } from "./hooks";
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Code2,
  Key,
  GitBranch,
  Clock,
  Sparkles,
  Terminal,
} from "lucide-react";

export function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { content, isLoaded, isUrl } = useHomePageContent();

  if (!isLoaded) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--muted)]">
          {t("common.loading")}
        </div>
      </PublicLayout>
    );
  }

  if (content) {
    return (
      <PublicLayout>
        {isUrl ? (
          <iframe
            src={content}
            className="h-[calc(100vh-8rem)] w-full border-0"
            title={t("home.customHomePage")}
          />
        ) : (
          <article className="mx-auto max-w-4xl px-4 py-12 prose prose-invert prose-neutral">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </article>
        )}
      </PublicLayout>
    );
  }

  const features = [
    {
      icon: Zap,
      title: "40+ AI Providers",
      description:
        "OpenAI, Anthropic, Google, Azure, AWS Bedrock, and more unified behind one API endpoint.",
    },
    {
      icon: Shield,
      title: "Enterprise Ready",
      description:
        "Rate limiting, key management, usage tracking, billing, and multi-tenant support.",
    },
    {
      icon: GitBranch,
      title: "Smart Routing",
      description:
        "Channel affinity, automatic failover, and intelligent load balancing across providers.",
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      description:
        "Real-time dashboards, per-model usage stats, cost tracking, and performance metrics.",
    },
    {
      icon: Key,
      title: "Key Management",
      description:
        "Generate, rotate, revoke keys. Set quotas, rate limits, and model restrictions per key.",
    },
    {
      icon: Clock,
      title: "Streaming & Low Latency",
      description:
        "SSE streaming, chunked responses, and edge-optimized routing for minimal overhead.",
    },
  ];

  const codeSample = `curl https://your-gateway/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-6",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'`;

  const stats = [
    { value: "40+", label: "AI Providers" },
    { value: "100%", label: "OpenAI Compatible" },
    { value: "<50ms", label: "Routing Overhead" },
    { value: "∞", label: "Scalable" },
  ];

  return (
    <PublicLayout>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-4 py-24 md:py-32 lg:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_800px_400px_at_top,_var(--accent-muted)_0%,_transparent_70%)] opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-30" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 border-[var(--accent-muted)] text-[var(--accent)]">
            <Sparkles className="h-3 w-3 mr-1" />
            Unified AI Gateway
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-pretty">
            One API.<br />
            <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-hover)] to-[var(--accent)] bg-clip-text text-transparent">
              Every model.
            </span>
          </h1>

          <p className="mt-6 text-lg text-[var(--muted)] md:text-xl text-pretty max-w-2xl mx-auto">
            Route, manage, and bill AI API calls across 40+ providers. OpenAI-compatible,
            self-hostable, production-ready.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => router.push("/sign-up")}>
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/pricing")}>
              <Code2 className="mr-2 h-4 w-4" />
              View pricing
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold font-mono text-[var(--foreground)]">
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Code example ─── */}
      <section className="px-4 py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold sm:text-3xl mb-3">
              Drop-in OpenAI replacement
            </h2>
            <p className="text-[var(--muted)] text-pretty max-w-xl mx-auto">
              Change one line. Get access to every AI provider.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/50 px-4 py-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[var(--muted)]" />
                <span className="text-xs font-mono text-[var(--muted)]">terminal</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--destructive)]/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--success)]/60" />
              </div>
            </div>
            <CardContent className="p-0">
              <pre className="p-5 font-mono text-xs md:text-sm overflow-x-auto text-[var(--foreground)]">
                <code>{codeSample}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-4 py-20 border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold sm:text-3xl mb-3">Everything you need</h2>
            <p className="text-[var(--muted)] max-w-xl mx-auto text-pretty">
              Infrastructure layer for AI applications. From development to production.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border border-[var(--border)] bg-[var(--surface)]/20 p-6 transition-all duration-200 hover:border-[var(--accent-muted)] hover:bg-[var(--surface)]/40"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent)]/10 mb-4 transition-transform group-hover:scale-110">
                  <feature.icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted)] text-pretty leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing preview ─── */}
      <section className="px-4 py-20 border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold sm:text-3xl mb-3">Pay only for what you use</h2>
            <p className="text-[var(--muted)] max-w-xl mx-auto text-pretty">
              Transparent pricing. No hidden fees. Enterprise volumes welcome.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: "Self-hosted", price: "Free", desc: "MIT licensed, deploy anywhere" },
              { label: "Pay-as-you-go", price: "Pass-through", desc: "Provider pricing + 0% markup" },
              { label: "Enterprise", price: "Custom", desc: "SLA, volume discounts, support" },
            ].map((tier, idx) => (
              <Card key={tier.label} className={idx === 1 ? "border-[var(--accent-muted)]" : ""}>
                <CardContent className="p-6">
                  {idx === 1 && (
                    <Badge className="mb-3">Popular</Badge>
                  )}
                  <div className="text-sm text-[var(--muted)] mb-1">{tier.label}</div>
                  <div className="text-2xl font-bold mb-2">{tier.price}</div>
                  <p className="text-xs text-[var(--muted)] mb-6">{tier.desc}</p>
                  <Button
                    variant={idx === 1 ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(idx === 2 ? "/about" : "/sign-up")}
                  >
                    {idx === 2 ? "Contact us" : "Start free"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 py-24 border-t border-[var(--border)]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4 text-pretty">
            Start routing in minutes
          </h2>
          <p className="text-[var(--muted)] mb-8 text-pretty">
            Sign up, generate an API key, and start making requests.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => router.push("/sign-up")}>
              Create free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => router.push("/about")}>
              Learn more
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
