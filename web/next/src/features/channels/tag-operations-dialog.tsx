"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tag, CheckCircle2, Ban, Pencil, Loader2 } from "lucide-react";
import {
  disableTagChannels,
  editTagChannels,
  enableTagChannels,
} from "./api";

interface TagOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TagOperationsDialog({ open, onOpenChange, onSuccess }: TagOperationsDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("enable");

  const [enableTag, setEnableTag] = useState("");
  const [disableTag, setDisableTag] = useState("");

  const [editTag, setEditTag] = useState("");
  const [editNewTag, setEditNewTag] = useState("");
  const [editModels, setEditModels] = useState("");
  const [editGroups, setEditGroups] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editWeight, setEditWeight] = useState("");

  const [busy, setBusy] = useState(false);

  const run = async (
    request: () => Promise<{ success: boolean; message?: string; data?: unknown }>,
    label: string,
  ) => {
    setBusy(true);
    try {
      const res = await request();
      if (res.success !== false) {
        const n = res.data;
        toast.success(`${label}${typeof n === "number" ? ` · ${n}` : ""}`);
        onSuccess?.();
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = () => {
    if (!enableTag.trim()) {
      toast.error("Enter a tag");
      return;
    }
    run(() => enableTagChannels(enableTag.trim()), "Channels enabled");
  };

  const handleDisable = () => {
    if (!disableTag.trim()) {
      toast.error("Enter a tag");
      return;
    }
    if (!confirm(`Disable all channels with tag "${disableTag.trim()}"?`)) return;
    run(() => disableTagChannels(disableTag.trim()), "Channels disabled");
  };

  const handleEdit = () => {
    if (!editTag.trim()) {
      toast.error("Enter the tag to edit");
      return;
    }
    const payload: {
      tag: string;
      new_tag?: string;
      priority?: number;
      weight?: number;
      models?: string;
      groups?: string;
    } = { tag: editTag.trim() };
    if (editNewTag.trim()) payload.new_tag = editNewTag.trim();
    if (editModels.trim()) payload.models = editModels.trim();
    if (editGroups.trim()) {
      payload.groups = editGroups
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(",");
    }
    if (editPriority !== "") {
      const p = Number(editPriority);
      if (!Number.isNaN(p)) payload.priority = p;
    }
    if (editWeight !== "") {
      const w = Number(editWeight);
      if (!Number.isNaN(w)) payload.weight = w;
    }
    run(() => editTagChannels(payload), "Channels updated");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tag Operations
          </DialogTitle>
          <DialogDescription>
            Bulk actions across all channels sharing a tag.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enable">Enable</TabsTrigger>
            <TabsTrigger value="disable">Disable</TabsTrigger>
            <TabsTrigger value="edit">Bulk edit</TabsTrigger>
          </TabsList>

          <TabsContent value="enable" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input
                value={enableTag}
                onChange={(e) => setEnableTag(e.target.value)}
                placeholder="vip"
                disabled={busy}
              />
            </div>
            <Button size="sm" onClick={handleEnable} disabled={busy}>
              {busy ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-2" />
              )}
              Enable all
            </Button>
          </TabsContent>

          <TabsContent value="disable" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input
                value={disableTag}
                onChange={(e) => setDisableTag(e.target.value)}
                placeholder="deprecated"
                disabled={busy}
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleDisable} disabled={busy}>
              {busy ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Ban className="h-3 w-3 mr-2" />
              )}
              Disable all
            </Button>
          </TabsContent>

          <TabsContent value="edit" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Existing tag</Label>
                <Input
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  placeholder="vip"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label>New tag (optional)</Label>
                <Input
                  value={editNewTag}
                  onChange={(e) => setEditNewTag(e.target.value)}
                  placeholder="vip2"
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Models (optional)</Label>
              <Textarea
                value={editModels}
                onChange={(e) => setEditModels(e.target.value)}
                placeholder="gpt-4o,gpt-4o-mini"
                className="min-h-[60px] font-mono text-xs"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label>Groups (optional)</Label>
              <Input
                value={editGroups}
                onChange={(e) => setEditGroups(e.target.value)}
                placeholder="default,vip"
                disabled={busy}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority (optional)</Label>
                <Input
                  type="number"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  placeholder="0"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (optional)</Label>
                <Input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="0"
                  disabled={busy}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleEdit} disabled={busy}>
              {busy ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Pencil className="h-3 w-3 mr-2" />
              )}
              Apply edits
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close") || "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
