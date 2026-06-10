"use client";

import { Palette, Ruler, Type, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useThemeCustomization,
  type ThemePreset,
  type ThemeRadius,
  type ThemeScale,
} from "@/context/theme-customization-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const PRESETS: { value: ThemePreset; label: string; swatch: string }[] = [
  { value: "default", label: "Default", swatch: "oklch(0.55 0.25 270)" },
  { value: "blue", label: "Blue", swatch: "oklch(0.55 0.22 240)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.55 0.25 290)" },
  { value: "teal", label: "Teal", swatch: "oklch(0.55 0.15 190)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.60 0.24 10)" },
  { value: "amber", label: "Amber", swatch: "oklch(0.70 0.20 70)" },
];

const RADII: { value: ThemeRadius; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const SCALES: { value: ThemeScale; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
];

export function ThemeCustomizer({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { customization, setPreset, setRadius, setScale, reset } = useThemeCustomization();
  const currentPreset =
    PRESETS.find((p) => p.value === customization.preset) ?? PRESETS[0];
  const currentRadius =
    RADII.find((r) => r.value === customization.radius) ?? RADII[2];
  const currentScale =
    SCALES.find((s) => s.value === customization.scale) ?? SCALES[1];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2",
        className,
      )}
    >
      {/* Preset */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("Color preset")}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t(currentPreset.label)}
            </span>
            <span
              aria-hidden
              className="h-3 w-3 rounded-full border border-[var(--border)]"
              style={{ background: currentPreset.swatch }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>{t("Color preset")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onSelect={() => setPreset(p.value)}
              className={cn(
                "flex items-center justify-between",
                customization.preset === p.value && "bg-[var(--surface-hover)]",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full border border-[var(--border)]"
                  style={{ background: p.swatch }}
                />
                {t(p.label)}
              </span>
              {customization.preset === p.value && (
                <span className="text-xs text-[var(--muted-foreground)]">{t("Active")}</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Radius */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("Corner radius")}
            className="gap-2"
          >
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">{t(currentRadius.label)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel>{t("Corner radius")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {RADII.map((r) => (
            <DropdownMenuItem
              key={r.value}
              onSelect={() => setRadius(r.value)}
              className={cn(customization.radius === r.value && "bg-[var(--surface-hover)]")}
            >
              {t(r.label)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Scale */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("UI scale")}
            className="gap-2"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">{t(currentScale.label)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>{t("UI scale")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SCALES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onSelect={() => setScale(s.value)}
              className={cn(customization.scale === s.value && "bg-[var(--surface-hover)]")}
            >
              {t(s.label)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset */}
      <Button
        variant="ghost"
        size="icon"
        onClick={reset}
        aria-label={t("Reset theme customization")}
        title={t("Reset theme customization")}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
