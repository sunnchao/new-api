"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  language?: string;
  code: string;
  showLineNumbers?: boolean;
  filename?: string;
}

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "do", "switch", "case", "break", "continue", "new", "class", "extends",
  "import", "export", "from", "as", "default", "async", "await", "try",
  "catch", "finally", "throw", "typeof", "instanceof", "in", "of", "true",
  "false", "null", "undefined", "this", "super", "static", "public",
  "private", "protected", "interface", "type", "enum", "implements",
  "void", "def", "lambda", "pass", "with", "yield", "raise", "elif",
  "self", "None", "True", "False", "print", "package", "func", "struct",
  "nil", "go", "defer", "chan", "select", "map", "range",
]);

const tokenize = (line: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  const regex =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|[{}[\]().,;:+\-*/=<>!&|^%~?]+|\s+)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(line)) !== null) {
    const t = m[0];
    let cls = "";
    if (/^\/\//.test(t) || /^\/\*/.test(t) || /^#/.test(t)) cls = "text-[var(--muted)] italic";
    else if (/^["'`]/.test(t)) cls = "text-[var(--success)]";
    else if (/^\d/.test(t)) cls = "text-[var(--warning)]";
    else if (/^[A-Za-z_$]/.test(t)) {
      if (KEYWORDS.has(t)) cls = "text-[var(--accent)] font-medium";
      else cls = "text-[var(--foreground)]";
    } else if (/^[{}[\]().,;:+\-*/=<>!&|^%~?]/.test(t)) {
      cls = "text-[var(--muted)]";
    }
    out.push(
      <span key={i++} className={cls}>
        {t}
      </span>
    );
  }
  return out;
};

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ language, code, showLineNumbers = false, filename, className, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);
    const lines = React.useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
    }, [code]);

    return (
      <div
        ref={ref}
        className={cn(
          "group/code my-3 overflow-hidden rounded-lg border border-[var(--border)] bg-[#0a0a0a] text-[var(--foreground)]",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1.5">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            {filename && <span className="font-mono text-[var(--foreground)]">{filename}</span>}
            {language && (
              <span className="rounded bg-[var(--background)] px-1.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                {language}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="flex min-w-full">
                {showLineNumbers && (
                  <span
                    aria-hidden
                    className="mr-4 inline-block w-8 shrink-0 select-none text-right text-[var(--muted)]/60"
                  >
                    {idx + 1}
                  </span>
                )}
                <span className="flex-1 whitespace-pre">
                  {line.length === 0 ? " " : tokenize(line)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    );
  }
);
CodeBlock.displayName = "CodeBlock";

const CodeBlockCopyButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { copied?: boolean }>(
  ({ copied, className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn("h-7 gap-1.5 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]", className)}
      {...props}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[var(--success)]" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  )
);
CodeBlockCopyButton.displayName = "CodeBlockCopyButton";

export { CodeBlock, CodeBlockCopyButton };
