"use client";

import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { getToolConfig } from "../constants";
import type { ToolConfig } from "../constants";
import { InstallationGuide } from "./installation-guide";

interface TutorialPageProps {
  toolId: string;
}

export function TutorialPage({ toolId }: TutorialPageProps) {
  const { t } = useTranslation();
  const tool = getToolConfig(toolId);

  if (!tool) {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto max-w-5xl p-6">
        {/* Hero Section */}
        <HeroSection tool={tool} t={t} />

        {/* Tabbed Content */}
        <TabbedContent tool={tool} t={t} />

        {/* CTA Section */}
        <CtaSection tool={tool} t={t} />
      </div>
    </div>
  );
}

function HeroSection({ tool, t }: { tool: ToolConfig; t: (k: string) => string }) {
  return (
    <div className="mb-8">
      <div
        className={`mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${tool.badgeGradient} px-4 py-2 text-white`}
      >
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">{tool.badgeText}</span>
      </div>

      <h1 className="mb-4 text-4xl font-bold md:text-5xl">
        {tool.name} {t("AI Programming Assistant")}
      </h1>

      <p className="mb-6 max-w-[800px] text-lg text-[var(--muted)]">
        {tool.subtitle}
      </p>

      {tool.externalLinks && tool.externalLinks.length > 0 && (
        <div className="mb-8 flex gap-3">
          {tool.externalLinks.map((link) => (
            <Button key={link.url} variant="outline" asChild>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ))}
        </div>
      )}

      {/* Terminal Demo */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-[var(--muted)]" />
          <span className="font-medium">{t("Terminal Demo")}</span>
        </div>
        <div className="overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
          <div className="mb-2">{tool.terminalDemo.prompt}</div>
          <div className="mb-3 text-green-400">{tool.terminalDemo.response}</div>
          {tool.terminalDemo.followUp && (
            <>
              <div className="mb-2">{tool.terminalDemo.followUp}</div>
              <div className="text-blue-300">{tool.terminalDemo.followUpResponse}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabbedContent({ tool, t }: { tool: ToolConfig; t: (k: string) => string }) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`h-6 w-1 rounded-full bg-gradient-to-b ${tool.accentGradient}`} />
          <CardTitle>{t("Feature Overview")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
            <TabsTrigger value="install">{t("Installation")}</TabsTrigger>
            <TabsTrigger value="apikey">{t("API Key")}</TabsTrigger>
            <TabsTrigger value="tutorial">{t("Tutorial")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <FeatureGrid tool={tool} />
          </TabsContent>

          <TabsContent value="install">
            <InstallationGuide steps={tool.installSteps} />
          </TabsContent>

          <TabsContent value="apikey">
            <InstallationGuide steps={tool.apiKeySteps} />
          </TabsContent>

          <TabsContent value="tutorial">
            <InstallationGuide steps={tool.tutorialSteps} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function FeatureGrid({ tool }: { tool: ToolConfig }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tool.features.map((feature, index) => (
        <div
          key={index}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:shadow-sm"
        >
          <div className={`mb-2 text-lg font-semibold ${feature.iconColor}`}>
            {feature.title}
          </div>
          <p className="text-sm text-[var(--muted)]">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

function CtaSection({ tool, t }: { tool: ToolConfig; t: (k: string) => string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-emerald-600" />
          <CardTitle>{t("Ready to Start?")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-lg text-[var(--muted)]">
          {t("Just a few simple steps to boost your development efficiency.")}
        </p>
        <div className={`grid grid-cols-1 gap-6 md:grid-cols-${Math.min(tool.ctaSteps.length, 3)}`}>
          {tool.ctaSteps.map((step, index) => (
            <div
              key={index}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:scale-105"
            >
              <div className="mb-4 text-6xl font-bold text-[var(--border)]">
                {index + 1}
              </div>
              <h4 className="mb-2 text-lg font-semibold">{step.title}</h4>
              <p className="text-sm text-[var(--muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
