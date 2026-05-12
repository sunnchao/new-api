"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link2, Copy } from "lucide-react";
import { buildChatLink, encodeChatLinkPayload, writeChatSession } from "./lib";

export default function Chat2LinkPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("Please enter chat content");
      return;
    }
    setLoading(true);
    try {
      // Encode chat content into a sharable link
      const id = encodeChatLinkPayload({ title, content, created: Date.now() });
      const link = buildChatLink(id);

      writeChatSession(id, {
        id,
        title: title || "Shared chat",
        messages: [{ role: "system", content }],
      });

      setGenerated(link);
      toast.success("Link generated");
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generated);
    toast.success(t("common.copied"));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link2 className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="text-2xl font-bold">Chat to Link</h1>
      </div>

      <p className="text-[var(--muted)] text-sm">
        Convert your chat content into a shareable link that others can open.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create shareable chat link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My shared chat"
            />
          </div>
          <div className="space-y-2">
            <Label>Chat content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Paste chat content or system prompt..."
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? t("common.loading") : "Generate link"}
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Badge variant="success">Ready</Badge>
              <code className="text-xs flex-1 truncate font-mono">{generated}</code>
              <Button variant="ghost" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
