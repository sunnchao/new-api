"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface Step {
  title: string;
  description: string;
  code?: string;
}

interface InstallationGuideProps {
  steps: Step[];
}

export function InstallationGuide({ steps }: InstallationGuideProps) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="flex flex-col gap-6 p-2 md:flex-row">
      {/* Step navigation */}
      <div className="w-full min-w-[200px] md:w-1/3">
        <div className="flex flex-col gap-1">
          {steps.map((step, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:bg-[var(--surface)]",
                index === current && "bg-[var(--surface)]"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  index < current
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : index === current
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                )}
              >
                {index < current ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  index === current
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                )}
              >
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="w-full md:w-2/3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <div className="mb-4 border-b border-[var(--border)] pb-4">
            <h3 className="text-lg font-semibold">{steps[current].title}</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              {steps[current].description}
            </p>
            {steps[current].code && (
              <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
                <code>{steps[current].code}</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
