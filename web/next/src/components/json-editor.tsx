"use client";

import { useState, useEffect } from "react";
import { Code, Table, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type JsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  keyLabel?: string;
  valueLabel?: string;
  emptyMessage?: string;
  template?: Record<string, unknown>;
  valueType?: "string" | "number" | "any";
  /** Simple mode: just a textarea with JSON validation (original web/next API) */
  error?: string;
  className?: string;
  rows?: number;
  id?: string;
  placeholder?: string;
};

type EditorRow = {
  id: string;
  key: string;
  value: string;
};

export function JsonEditor({
  value,
  onChange,
  disabled = false,
  keyPlaceholder,
  valuePlaceholder,
  keyLabel,
  valueLabel,
  emptyMessage,
  template,
  valueType = "string",
  // Simple mode props (backward compat)
  error,
  className,
  rows = 10,
  id,
  placeholder,
}: JsonEditorProps) {
  const { t } = useTranslation();

  // Determine mode: if none of the visual-mode props are provided, use simple mode
  const hasVisualProps =
    keyPlaceholder !== undefined ||
    valuePlaceholder !== undefined ||
    keyLabel !== undefined ||
    valueLabel !== undefined ||
    emptyMessage !== undefined ||
    template !== undefined ||
    valueType !== "string";

  const resolvedEmptyMessage =
    emptyMessage ?? t("No mappings configured. Click \"Add Row\" to get started.");
  const resolvedKeyPlaceholder = keyPlaceholder ?? t("Key");
  const resolvedValuePlaceholder = valuePlaceholder ?? t("Value");
  const resolvedKeyLabel = keyLabel ?? t("Key");
  const resolvedValueLabel = valueLabel ?? t("Value");
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [rows_, setRows] = useState<EditorRow[]>([]);
  const [jsonValue, setJsonValue] = useState(value);
  const [localError, setLocalError] = useState<string | null>(null);

  // Simple mode (original web/next API)
  if (!hasVisualProps) {
    const handleBlur = () => {
      if (!value.trim()) {
        setLocalError(null);
        return;
      }
      try {
        JSON.parse(value);
        setLocalError(null);
      } catch (e) {
        setLocalError(e instanceof Error ? e.message : "Invalid JSON");
      }
    };

    const displayError = error ?? localError;

    return (
      <div className={cn("w-full", className)}>
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          className={cn(
            "font-mono text-xs leading-relaxed",
            displayError &&
              "border-[var(--destructive)] focus-visible:ring-[var(--destructive)]"
          )}
        />
        {displayError ? (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-[var(--destructive)]">
            <span className="break-words">{displayError}</span>
          </div>
        ) : null}
      </div>
    );
  }

  // Visual/JSON mode editor (default theme API)
  const parseJsonToRows = (json: string) => {
    try {
      if (!json.trim()) {
        setRows([]);
        return;
      }
      const parsed = JSON.parse(json);
      const newRows: EditorRow[] = Object.entries(parsed).map(
        ([key, val], index) => ({
          id: `${Date.now()}-${index}`,
          key,
          value: typeof val === "object" ? JSON.stringify(val) : String(val),
        })
      );
      setRows(newRows);
    } catch (_error) {
      // Invalid JSON, keep current rows
    }
  };

  useEffect(() => {
    if (value !== jsonValue) {
      setJsonValue(value);
      parseJsonToRows(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const convertRowsToJson = (updatedRows: EditorRow[]): string => {
    if (updatedRows.length === 0) {
      return "";
    }
    const obj: Record<string, unknown> = {};
    updatedRows.forEach((row) => {
      if (row.key.trim()) {
        let parsedValue: unknown = row.value.trim();

        if (valueType === "number") {
          parsedValue = Number(parsedValue) || 0;
        } else if (valueType === "any") {
          try {
            parsedValue = JSON.parse(row.value);
          } catch {
            parsedValue = row.value.trim();
          }
        }

        obj[row.key.trim()] = parsedValue;
      }
    });
    return JSON.stringify(obj, null, 2);
  };

  const handleAddRow = () => {
    const newRow: EditorRow = {
      id: `${Date.now()}`,
      key: "",
      value: "",
    };
    const updatedRows = [...rows_, newRow];
    setRows(updatedRows);
  };

  const handleDeleteRow = (id: string) => {
    const updatedRows = rows_.filter((row) => row.id !== id);
    setRows(updatedRows);
    const json = convertRowsToJson(updatedRows);
    setJsonValue(json);
    onChange(json);
  };

  const handleRowChange = (
    id: string,
    field: "key" | "value",
    newValue: string
  ) => {
    const updatedRows = rows_.map((row) =>
      row.id === id ? { ...row, [field]: newValue } : row
    );
    setRows(updatedRows);
    const json = convertRowsToJson(updatedRows);
    setJsonValue(json);
    onChange(json);
  };

  const handleJsonChange = (newJson: string) => {
    setJsonValue(newJson);
    onChange(newJson);
    parseJsonToRows(newJson);
  };

  const handleFillTemplate = () => {
    if (!template) return;
    const templateJson = JSON.stringify(template, null, 2);
    setJsonValue(templateJson);
    onChange(templateJson);
    parseJsonToRows(templateJson);
  };

  const toggleMode = () => {
    if (mode === "visual") {
      const json = convertRowsToJson(rows_);
      setJsonValue(json);
      onChange(json);
      setMode("json");
    } else {
      parseJsonToRows(jsonValue);
      setMode("visual");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleMode}
            disabled={disabled}
          >
            {mode === "visual" ? (
              <>
                <Code className="mr-2 h-4 w-4" />
                {t("JSON Mode")}
              </>
            ) : (
              <>
                <Table className="mr-2 h-4 w-4" />
                {t("Visual Mode")}
              </>
            )}
          </Button>
          {template && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={handleFillTemplate}
              disabled={disabled}
            >
              {t("Fill Template")}
            </Button>
          )}
        </div>
      </div>

      {mode === "visual" ? (
        <div className="space-y-2">
          {rows_.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-medium">
                <div>{resolvedKeyLabel}</div>
                <div>{resolvedValueLabel}</div>
                <div className="w-10"></div>
              </div>
              {rows_.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2"
                >
                  <Input
                    value={row.key}
                    onChange={(e) =>
                      handleRowChange(row.id, "key", e.target.value)
                    }
                    placeholder={resolvedKeyPlaceholder}
                    disabled={disabled}
                  />
                  <Input
                    value={row.value}
                    onChange={(e) =>
                      handleRowChange(row.id, "value", e.target.value)
                    }
                    placeholder={resolvedValuePlaceholder}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete row"
                    onClick={() => handleDeleteRow(row.id)}
                    disabled={disabled}
                    className="h-10 w-10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-24 items-center justify-center rounded-md border border-dashed text-sm">
              {resolvedEmptyMessage}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Add Row")}
          </Button>
        </div>
      ) : (
        <Textarea
          value={jsonValue}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder={
            template ? JSON.stringify(template, null, 2) : '{"key": "value"}'
          }
          disabled={disabled}
          rows={8}
          className={cn("font-mono text-sm")}
        />
      )}
    </div>
  );
}
