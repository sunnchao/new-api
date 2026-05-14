"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, Search, Code2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

type RatioMap = Record<string, number>;

function parseJson(raw: string): RatioMap {
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function toJson(map: RatioMap): string {
  return JSON.stringify(map, null, 2);
}

// Price per 1M tokens in USD (ratio * 2 / 1e6 * 1e6 = ratio * 2 / 1000)
function ratioToPrice(ratio: number): string {
  return (ratio * 2 / 1000).toFixed(6).replace(/\.?0+$/, "");
}

function priceToRatio(price: string): number {
  const n = parseFloat(price);
  return isNaN(n) ? 0 : n * 1000 / 2;
}

interface RowData {
  name: string;
  inputRatio: number;
  completionRatio: number;
}

interface ModelRatioEditorProps {
  modelRatioRaw: string;
  completionRatioRaw: string;
  onSave: (modelRatio: string, completionRatio: string) => Promise<void>;
  saving: boolean;
}

export function ModelRatioEditor({ modelRatioRaw, completionRatioRaw, onSave, saving }: ModelRatioEditorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<"visual" | "json">("visual");
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RowData | null>(null);
  const [form, setForm] = React.useState({ name: "", inputPrice: "", completionMultiplier: "1" });

  const modelRatioMap = React.useMemo(() => parseJson(modelRatioRaw), [modelRatioRaw]);
  const completionRatioMap = React.useMemo(() => parseJson(completionRatioRaw), [completionRatioRaw]);

  const [localModelRatio, setLocalModelRatio] = React.useState(modelRatioRaw);
  const [localCompletionRatio, setLocalCompletionRatio] = React.useState(completionRatioRaw);

  React.useEffect(() => { setLocalModelRatio(modelRatioRaw); }, [modelRatioRaw]);
  React.useEffect(() => { setLocalCompletionRatio(completionRatioRaw); }, [completionRatioRaw]);

  const rows: RowData[] = React.useMemo(() => {
    const names = new Set([...Object.keys(modelRatioMap), ...Object.keys(completionRatioMap)]);
    return Array.from(names)
      .filter(n => !search || n.toLowerCase().includes(search.toLowerCase()))
      .sort()
      .map(name => ({
        name,
        inputRatio: modelRatioMap[name] ?? 0,
        completionRatio: completionRatioMap[name] ?? 1,
      }));
  }, [modelRatioMap, completionRatioMap, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", inputPrice: "", completionMultiplier: "1" });
    setDialogOpen(true);
  };

  const openEdit = (row: RowData) => {
    setEditing(row);
    setForm({
      name: row.name,
      inputPrice: ratioToPrice(row.inputRatio),
      completionMultiplier: String(row.completionRatio),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (name: string) => {
    const mr = { ...parseJson(localModelRatio) };
    const cr = { ...parseJson(localCompletionRatio) };
    delete mr[name];
    delete cr[name];
    await onSave(toJson(mr), toJson(cr));
  };

  const handleSaveRow = async () => {
    if (!form.name.trim()) { toast.error("Model name required"); return; }
    const mr = { ...parseJson(localModelRatio) };
    const cr = { ...parseJson(localCompletionRatio) };
    if (editing && editing.name !== form.name) {
      delete mr[editing.name];
      delete cr[editing.name];
    }
    mr[form.name] = priceToRatio(form.inputPrice);
    const mult = parseFloat(form.completionMultiplier);
    if (!isNaN(mult) && mult !== 1) cr[form.name] = mult;
    else delete cr[form.name];
    await onSave(toJson(mr), toJson(cr));
    setDialogOpen(false);
  };

  const handleJsonSave = async () => {
    try {
      JSON.parse(localModelRatio);
      JSON.parse(localCompletionRatio);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    await onSave(localModelRatio, localCompletionRatio);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Model Pricing</CardTitle>
          <CardDescription>Input/output price per 1M tokens (USD)</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "visual" | "json")}>
            <TabsList className="h-8">
              <TabsTrigger value="visual" className="h-7 px-2 text-xs"><Eye className="h-3 w-3 mr-1" />Visual</TabsTrigger>
              <TabsTrigger value="json" className="h-7 px-2 text-xs"><Code2 className="h-3 w-3 mr-1" />JSON</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "visual" && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add
            </Button>
          )}
          {mode === "json" && (
            <Button size="sm" onClick={handleJsonSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" />Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {mode === "visual" ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
              <Input placeholder="Search models..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <div className="rounded-md border border-[var(--border)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Input ($/1M)</TableHead>
                    <TableHead className="text-right">Output multiplier</TableHead>
                    <TableHead className="text-right">Output ($/1M)</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-[var(--muted)] text-sm">No models configured</TableCell></TableRow>
                  ) : rows.map(row => (
                    <TableRow key={row.name}>
                      <TableCell className="font-mono text-xs font-medium">{row.name}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{ratioToPrice(row.inputRatio)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono text-xs">{row.completionRatio}×</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{ratioToPrice(row.inputRatio * row.completionRatio)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(row)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--destructive)]" onClick={() => handleDelete(row.name)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">{rows.length} models · Changes auto-save on row edit/delete</p>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono">ModelRatio (input)</Label>
              <Textarea value={localModelRatio} onChange={e => setLocalModelRatio(e.target.value)} rows={16} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">CompletionRatio (output multiplier)</Label>
              <Textarea value={localCompletionRatio} onChange={e => setLocalCompletionRatio(e.target.value)} rows={16} className="font-mono text-xs" />
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Model" : "Add Model"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Model name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="gpt-4o" disabled={!!editing} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Input price ($/1M tokens)</Label>
              <Input type="number" step="0.001" value={form.inputPrice} onChange={e => setForm(f => ({ ...f, inputPrice: e.target.value }))} placeholder="2.5" />
            </div>
            <div className="space-y-1.5">
              <Label>Output multiplier (relative to input)</Label>
              <Input type="number" step="0.1" value={form.completionMultiplier} onChange={e => setForm(f => ({ ...f, completionMultiplier: e.target.value }))} placeholder="1" />
              <p className="text-xs text-[var(--muted)]">
                Output = {form.inputPrice && form.completionMultiplier
                  ? `$${(parseFloat(form.inputPrice) * parseFloat(form.completionMultiplier) || 0).toFixed(4)}/1M`
                  : "—"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
            <Button onClick={handleSaveRow} disabled={saving}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
