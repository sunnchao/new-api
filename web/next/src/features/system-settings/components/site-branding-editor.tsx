"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save, Globe, Image, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

interface OptionMap { [key: string]: string }

async function saveOptions(updates: OptionMap) {
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      api.put("/api/option/", { key, value })
    )
  );
}

interface SiteBrandingEditorProps {
  options: OptionMap;
  onSaved: () => void;
}

export function SiteBrandingEditor({ options, onSaved }: SiteBrandingEditorProps) {
  const [form, setForm] = React.useState({
    SystemName: options.SystemName ?? "",
    Logo: options.Logo ?? "",
    Footer: options.Footer ?? "",
    About: options.About ?? "",
    HomePageContent: options.HomePageContent ?? "",
    ServerAddress: options.ServerAddress ?? "",
    "legal.user_agreement": options["legal.user_agreement"] ?? "",
    "legal.privacy_policy": options["legal.privacy_policy"] ?? "",
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setForm({
      SystemName: options.SystemName ?? "",
      Logo: options.Logo ?? "",
      Footer: options.Footer ?? "",
      About: options.About ?? "",
      HomePageContent: options.HomePageContent ?? "",
      ServerAddress: options.ServerAddress ?? "",
      "legal.user_agreement": options["legal.user_agreement"] ?? "",
      "legal.privacy_policy": options["legal.privacy_policy"] ?? "",
    });
  }, [options]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveOptions(form);
      toast.success("Saved");
      onSaved();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--accent)]" />
            Basic Branding
          </CardTitle>
          <CardDescription>System name, logo and server address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>System Name</Label>
              <Input value={form.SystemName} onChange={set("SystemName")} placeholder="New API" />
            </div>
            <div className="space-y-1.5">
              <Label>Server Address</Label>
              <Input value={form.ServerAddress} onChange={set("ServerAddress")} placeholder="https://api.example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <div className="flex gap-2">
              <Input value={form.Logo} onChange={set("Logo")} placeholder="https://..." className="flex-1" />
              {form.Logo && (
                <img src={form.Logo} alt="logo preview" className="h-9 w-9 rounded object-contain border border-[var(--border)]" onError={e => (e.currentTarget.style.display = "none")} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--accent)]" />
            Content
          </CardTitle>
          <CardDescription>Footer HTML, about page and home page content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Footer HTML</Label>
            <Textarea value={form.Footer} onChange={set("Footer")} rows={3} placeholder="<p>Powered by New API</p>" className="font-mono text-xs" />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Home Page Content</Label>
            <p className="text-xs text-[var(--muted)]">Markdown, HTML, or a URL (iframe). Leave empty for default landing page.</p>
            <Textarea value={form.HomePageContent} onChange={set("HomePageContent")} rows={6} className="font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label>About Page Content</Label>
            <Textarea value={form.About} onChange={set("About")} rows={6} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-[var(--accent)]" />
            Legal
          </CardTitle>
          <CardDescription>User agreement and privacy policy URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>User Agreement URL</Label>
            <Input value={form["legal.user_agreement"]} onChange={set("legal.user_agreement")} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Privacy Policy URL</Label>
            <Input value={form["legal.privacy_policy"]} onChange={set("legal.privacy_policy")} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>
    </div>
  );
}
