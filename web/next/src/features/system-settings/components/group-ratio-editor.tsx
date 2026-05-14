"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type RatioMap = Record<string, number>;

function parseJson(raw: string): RatioMap {
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}
function toJson(map: RatioMap): string {
  return JSON.stringify(map, null, 2);
}

interface GroupRatioEditorProps {
  title: string;
  description: string;
  raw: string;
  onSave: (value: string) => Promise<void>;
  saving: boolean;
  /** If true, value is a multiplier (e.g. 1.0 = 100%). If false, it's a price ratio. */
  isMultiplier?: boolean;
}

export function GroupRatioEditor({ title, description, raw, onSave, saving, isMultiplier = true }: GroupRatioEditorProps) {
  const map = React.useMemo(() => parseJson(raw), [raw]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", value: "" });

  const rows = React.useMemo(() =>
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
    [map]
  );

  const openAdd = () => { setEditing(null); setForm({ name: "", value: isMultiplier ? "1" : "0" }); setDialogOpen(true); };
  const openEdit = (name: string, value: number) => { setEditing(name); setForm({ name, value: String(value) }); setDialogOpen(true); };

  const handleDelete = async (name: string) => {
    const next = { ...map };
    delete next[name];
    await onSave(toJson(next));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Group name required"); return; }
    const num = parseFloat(form.value);
    if (isNaN(num)) { toast.error("Invalid value"); return; }
    const next = { ...map };
    if (editing && editing !== form.name) delete next[editing];
    next[form.name] = num;
    await onSave(toJson(next));
    setDialogOpen(false);
  };

  const formatValue = (v: number) => isMultiplier ? `${(v * 100).toFixed(0)}%` : String(v);
  const badgeVariant = (v: number): "default" | "secondary" | "outline" => {
    if (!isMultiplier) return "outline";
    if (v > 1) return "default";
    if (v < 1) return "secondary";
    return "outline";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[var(--border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">{isMultiplier ? "Multiplier" : "Value"}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-6 text-[var(--muted)] text-sm">No groups configured</TableCell></TableRow>
              ) : rows.map(([name, value]) => (
                <TableRow key={name}>
                  <TableCell className="font-mono text-sm font-medium">{name}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={badgeVariant(value)} className="font-mono">{formatValue(value)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(name, value)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--destructive)]" onClick={() => handleDelete(name)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Group" : "Add Group"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Group name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="vip" disabled={!!editing} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>{isMultiplier ? "Multiplier (1.0 = 100%)" : "Value"}</Label>
              <Input type="number" step="0.1" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={isMultiplier ? "1.0" : "0"} />
              {isMultiplier && form.value && (
                <p className="text-xs text-[var(--muted)]">{(parseFloat(form.value) * 100 || 0).toFixed(0)}% of base price</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
            <Button onClick={handleSave} disabled={saving}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
