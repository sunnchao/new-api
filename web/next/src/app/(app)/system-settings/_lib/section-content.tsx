"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SystemSettingsEnhancements } from "@/features/system-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findSection, type OptionField, type SectionDef, type CategoryDef } from "./config";

type OptionsMap = Record<string, string>;

const OPTIONS_EVENT = "system-settings:options-refetch";

function inferType(field: OptionField): Exclude<OptionField["type"], undefined> {
  if (field.type) return field.type;
  if (field.key.endsWith("Enabled") || field.key.endsWith("enabled")) return "bool";
  return "text";
}

function toBool(value: string | undefined): boolean {
  if (value == null) return false;
  return value === "true" || value === "1";
}

export function SectionContent({
  categoryId,
  sectionId,
}: {
  categoryId: string;
  sectionId: string;
}) {
  const { t } = useTranslation();
  const match = useMemo(
    () => findSection(categoryId, sectionId),
    [categoryId, sectionId]
  );

  const [options, setOptions] = useState<OptionsMap>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setLoaded(false);
      api
        .get("/api/option/")
        .then((res) => {
          if (cancelled) return;
          const list = res.data?.data as Array<{ key: string; value: string }> | undefined;
          if (list) {
            const map: OptionsMap = {};
            for (const opt of list) map[opt.key] = String(opt.value ?? "");
            setOptions(map);
          }
        })
        .finally(() => !cancelled && setLoaded(true));
    };
    load();
    const handler = () => load();
    window.addEventListener(OPTIONS_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(OPTIONS_EVENT, handler);
    };
  }, []);

  if (!match) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("common.notFound", { defaultValue: "Not found" })}</CardTitle>
          <CardDescription>
            {t("systemSettings.sectionNotFound", {
              defaultValue: `No section '${sectionId}' under '${categoryId}'.`,
            })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { category, section } = match;

  const setLocal = (key: string, value: string) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const saveOne = async (key: string) => {
    setSaving(key);
    try {
      await api.put("/api/option/", { key, value: options[key] ?? "" });
      toast.success(t("common.success", { defaultValue: "Saved" }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t("common.error", { defaultValue: "Error" }));
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    setSavingAll(true);
    try {
      const tasks = section.fields.map((f) =>
        api.put("/api/option/", { key: f.key, value: options[f.key] ?? "" })
      );
      await Promise.all(tasks);
      toast.success(t("common.success", { defaultValue: "Saved" }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t("common.error", { defaultValue: "Error" }));
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[var(--surface)]/40">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CardTitle>{section.title}</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {category.label}
              </Badge>
            </div>
            <CardDescription>{section.description}</CardDescription>
          </div>
          {section.fields.length > 0 ? (
            <Button onClick={saveAll} disabled={!loaded || savingAll} size="sm">
              <Save className="mr-1 h-3.5 w-3.5" />
              {savingAll
                ? t("common.loading", { defaultValue: "Saving..." })
                : t("systemSettings.saveAll", { defaultValue: "Save all" })}
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-6">
          {section.note ? (
            <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
              {section.note}
            </p>
          ) : null}

          {!loaded && section.fields.length > 0 ? (
            <div className="space-y-4">
              {section.fields.slice(0, 6).map((f) => (
                <Skeleton key={f.key} className="h-14 rounded" />
              ))}
            </div>
          ) : null}

          {loaded && section.fields.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {t("systemSettings.noFields", {
                defaultValue: "No editable options in this subsection.",
              })}
            </p>
          ) : null}

          {loaded
            ? section.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={options[field.key] ?? ""}
                  onChange={(v) => setLocal(field.key, v)}
                  onSave={() => saveOne(field.key)}
                  saving={saving === field.key}
                  saveLabel={t("common.save", { defaultValue: "Save" })}
                  savingLabel={t("common.loading", { defaultValue: "Saving..." })}
                />
              ))
            : null}
        </CardContent>
      </Card>

      <SystemSettingsEnhancements categoryId={categoryId} sectionId={sectionId} />
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  onSave,
  saving,
  saveLabel,
  savingLabel,
}: {
  field: OptionField;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
  savingLabel: string;
}) {
  const type = inferType(field);
  const label = field.label ?? field.key;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {label}
          </Label>
          <p className="truncate text-xs text-[var(--muted)] font-mono">{field.key}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSave} disabled={saving}>
          <Save className="mr-1 h-3 w-3" />
          {saving ? savingLabel : saveLabel}
        </Button>
      </div>

      {field.description ? (
        <p className="text-xs text-[var(--muted)]">{field.description}</p>
      ) : null}

      {type === "bool" ? (
        <div className="flex items-center gap-2">
          <Switch
            id={field.key}
            checked={toBool(value)}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          />
          <span className="text-xs text-[var(--muted)]">
            {toBool(value) ? "true" : "false"}
          </span>
        </div>
      ) : type === "textarea" ? (
        <Textarea
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? 6}
          placeholder={field.placeholder}
          className="font-mono text-xs"
        />
      ) : type === "select" && field.options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key}>
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "number" ? (
        <Input
          id={field.key}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="font-mono text-xs"
        />
      ) : (
        <Input
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="font-mono text-xs"
        />
      )}
    </div>
  );
}

export function SubsectionTabs({
  category,
  activeSectionId,
}: {
  category: CategoryDef;
  activeSectionId: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] p-1">
      {category.sections.map((s) => {
        const active = s.id === activeSectionId;
        return (
          <a
            key={s.id}
            href={`/system-settings/${category.id}/${s.id}`}
            className={
              "rounded px-3 py-1.5 text-xs font-medium transition-colors " +
              (active
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--surface)]/60 hover:text-[var(--foreground)]")
            }
          >
            {s.title}
          </a>
        );
      })}
    </div>
  );
}

export function sectionExists(category: CategoryDef, sectionId: string): SectionDef | undefined {
  return category.sections.find((s) => s.id === sectionId);
}
