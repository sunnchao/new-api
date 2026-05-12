"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getCommonHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readChatSession, writeChatSession } from "./lib";
import type { ChatMessage, ChatSession } from "./types";

export default function ChatPage({ chatId }: { chatId: string }) {
  const { t } = useTranslation();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedSession = readChatSession(chatId);
    setSession(storedSession);
    setMessages(storedSession.messages || []);
    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    const marker = messagesEndRef.current;
    const container = marker?.parentElement;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (session && messages.length > 0) {
      const updated = { ...session, messages };
      writeChatSession(chatId, updated);
    }
  }, [messages, session, chatId]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const all = [...messages, userMsg];
    setMessages(all);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { ...getCommonHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          model: session?.model || "gpt-3.5-turbo",
          messages: all.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true })
          .split("\n")
          .filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            }
          } catch {}
        }
      }
    } finally {
      setStreaming(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-[calc(100vh-7rem)] rounded-lg" />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/playground">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-xl font-bold">
            {session?.title || `Chat ${chatId.slice(0, 8)}`}
          </h1>
        </div>
      </div>

      <ScrollArea className="flex-1 mb-4 rounded-lg border border-[var(--border)] p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--muted)]">
            No messages yet. Start chatting below.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--surface)]"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("playground.sendMessage")}
          rows={1}
          className="min-h-[2.5rem] max-h-[8rem] resize-none"
          disabled={streaming}
        />
        <Button onClick={handleSend} disabled={streaming || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
