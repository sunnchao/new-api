"use client";

import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCommonHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { toast } from "sonner";
import {
  Send, Trash2, Settings, ChevronDown, Copy, RefreshCw, ThumbsUp, ThumbsDown,
  Sparkles, Brain, Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import {
  getPlaygroundGroups,
  getPlaygroundModels,
} from "./api";
import { PLAYGROUND_API_ENDPOINTS, PLAYGROUND_STORAGE_KEY } from "./constants";
import type { ChatMessage, PlaygroundSettings } from "./types";

const defaultSettings: PlaygroundSettings = {
  model: "",
  group: "",
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
};

const starterPrompts = [
  "Explain a tricky concept like I'm five.",
  "Write a SQL query that finds duplicate emails.",
  "Draft a friendly follow-up email.",
  "Review this code snippet for bugs.",
];

export default function PlaygroundPage() {
  const { t } = useTranslation();

  const [settings, setSettings] = useState<PlaygroundSettings>(defaultSettings);
  const [models, setModels] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hydrate settings from localStorage once
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(PLAYGROUND_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings((s) => ({ ...s, ...parsed }));
      }
    } catch {}
  }, []);

  // Persist settings changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Load models and groups
  useEffect(() => {
    getPlaygroundModels().then(setModels).catch(() => {});
    getPlaygroundGroups().then(setGroups).catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    const marker = messagesEndRef.current;
    const container = marker?.parentElement;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);
  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const sendMessage = async (overrideMessages?: ChatMessage[], overrideInput?: string) => {
    const trimmed = (overrideInput ?? input).trim();
    const baseMessages = overrideMessages ?? messages;
    if ((!trimmed && !overrideMessages) || streaming) return;

    const outbound: ChatMessage[] = trimmed
      ? [...baseMessages, { role: "user", content: trimmed }]
      : baseMessages;

    setMessages(outbound);
    if (!overrideMessages) setInput("");
    setStreaming(true);

    const payload: any = {
      model: settings.model || "gpt-3.5-turbo",
      messages: [
        ...(settings.systemPrompt ? [{ role: "system", content: settings.systemPrompt }] : []),
        ...outbound.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      temperature: settings.temperature,
      top_p: settings.topP,
      max_tokens: settings.maxTokens,
    };

    const headers: Record<string, string> = {
      ...getCommonHeaders(),
      "Content-Type": "application/json",
    };

    try {
      abortRef.current = new AbortController();
      const res = await fetch(PLAYGROUND_API_ENDPOINTS.CHAT_COMPLETIONS, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errText}` }]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let reasoning = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "", reasoning: "" }]);

      let buffer = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta || {};
            if (delta.reasoning_content || delta.reasoning) {
              reasoning += delta.reasoning_content || delta.reasoning || "";
            }
            if (delta.content) {
              content += delta.content;
            }
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content, reasoning };
              return next;
            });
          } catch {
            // ignore malformed
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("common.copied") || "Copied");
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleRegenerate = async (index: number) => {
    // Re-run from the user message just before this assistant message
    const truncated = messages.slice(0, index);
    setMessages(truncated);
    // Give state a tick to settle before re-send
    setTimeout(() => sendMessage(truncated, ""), 0);
  };

  const handleRate = (index: number, up: boolean) => {
    toast.success(up ? (t("playground.thanksUp") || "Thanks for the feedback") : (t("playground.thanksDown") || "Noted"));
  };

  const handleSuggestion = (s: string) => {
    if (streaming) return;
    setInput(s);
  };

  const parsedMessages = useMemo(() => {
    return messages.map((m) => {
      if (m.role !== "assistant") return m;
      // Extract <thinking>...</thinking> or <reasoning>...</reasoning> from content
      let content = m.content;
      let reasoning = m.reasoning || "";
      const match = content.match(/<(thinking|reasoning)>([\s\S]*?)<\/\1>/);
      if (match) {
        reasoning = reasoning ? `${reasoning}\n${match[2].trim()}` : match[2].trim();
        content = content.replace(match[0], "").trim();
      }
      return { ...m, content, reasoning };
    });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t("playground.title")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen((v) => !v)}>
            <Settings className="h-4 w-4 mr-2" />
            {t("playground.settings") || "Settings"}
            <ChevronDown className={cn("h-3.5 w-3.5 ml-1 transition-transform", settingsOpen && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("playground.clear")}
          </Button>
        </div>
      </div>

      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
          <Card className="mb-4">
            <CardContent className="py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("playground.model")}</Label>
                  <Select value={settings.model} onValueChange={(v) => setSettings({ ...settings, model: v })}>
                    <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                    <SelectContent>
                      {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("playground.group")}</Label>
                  <Select value={settings.group} onValueChange={(v) => setSettings({ ...settings, group: v })}>
                    <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("playground.systemPrompt")}</Label>
                <Textarea
                  value={settings.systemPrompt}
                  onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                  rows={2}
                  placeholder="You are a helpful assistant..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SliderField
                  label={t("playground.temperature") || "Temperature"}
                  value={settings.temperature}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={(v) => setSettings({ ...settings, temperature: v })}
                />
                <SliderField
                  label={t("playground.topP") || "Top P"}
                  value={settings.topP}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setSettings({ ...settings, topP: v })}
                />
                <div className="space-y-1.5">
                  <Label>{t("playground.maxTokens") || "Max tokens"}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.maxTokens}
                    onChange={(e) => setSettings({ ...settings, maxTokens: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Conversation */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 rounded-lg border border-[var(--border)] p-4 mb-4 overflow-hidden"
      >
        <ScrollArea className="h-full pr-2">
          {parsedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted)] py-20">
              <Sparkles className="h-8 w-8 mb-4 opacity-30" />
              <p className="text-sm">{t("playground.empty") || "Send a message to start chatting"}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {parsedMessages.map((msg, i) => (
                <Message key={i} role={msg.role}>
                  <MessageContent>
                    {msg.role === "assistant" && msg.reasoning && (
                      <Reasoning text={msg.reasoning} />
                    )}
                    {msg.role === "assistant" ? (
                      <Response content={msg.content} />
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                    {msg.role === "assistant" && msg.content && !streaming && (
                      <Actions
                        onCopy={() => handleCopy(msg.content)}
                        onRegenerate={() => handleRegenerate(i)}
                        onUp={() => handleRate(i, true)}
                        onDown={() => handleRate(i, false)}
                      />
                    )}
                  </MessageContent>
                </Message>
              ))}
              {streaming && parsedMessages[parsedMessages.length - 1]?.role !== "assistant" && (
                <div className="text-xs text-[var(--muted)] pl-11 animate-pulse">
                  {t("playground.generating")}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {starterPrompts.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={t("playground.sendMessage")}
          rows={1}
          className="min-h-[2.5rem] max-h-[8rem] resize-none"
          disabled={streaming}
        />
        {streaming ? (
          <Button variant="outline" onClick={handleStop}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => sendMessage()} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Local helper components
// ──────────────────────────────────────────

function Response({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
    </div>
  );
}

function Actions({
  onCopy, onRegenerate, onUp, onDown,
}: {
  onCopy: () => void;
  onRegenerate: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 mt-2 -ml-1 opacity-60 group-hover/message:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy} title={t("common.copy") || "Copy"}>
        <Copy className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRegenerate} title={t("playground.regenerate") || "Regenerate"}>
        <RefreshCw className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onUp} title="Good">
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDown} title="Bad">
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  );
}

function Reasoning({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-2">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <Brain className="h-3 w-3" />
          {t("playground.reasoning") || "Reasoning"}
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)]/40 p-2 text-xs text-[var(--muted)] whitespace-pre-wrap">
        {text}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SliderField({
  label, value, min, max, step, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs font-mono text-[var(--muted)]">{value.toFixed(2)}</span>
      </div>
      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--surface)]">
          <SliderPrimitive.Range className="absolute h-full bg-[var(--accent)]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border border-[var(--border)] bg-[var(--background)] shadow transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
