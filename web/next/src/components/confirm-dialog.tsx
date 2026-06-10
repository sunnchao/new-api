"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Description text. Aliases: `desc` */
  description?: React.ReactNode;
  desc?: React.ReactNode;
  confirmText?: React.ReactNode;
  cancelText?: string;
  cancelBtnText?: string;
  /** Visual variant. Use `variant="destructive"` or the shorthand `destructive` boolean. */
  variant?: "default" | "destructive";
  /** Shorthand for `variant="destructive"` */
  destructive?: boolean;
  /** Confirm handler. Either `onConfirm` or `handleConfirm` must be provided. */
  onConfirm?: () => void | Promise<void>;
  /** Alias for `onConfirm` */
  handleConfirm?: () => void | Promise<void>;
  /** External loading state override */
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  desc,
  confirmText = "Confirm",
  cancelText,
  cancelBtnText,
  variant,
  destructive,
  onConfirm,
  handleConfirm,
  isLoading: externalLoading,
  disabled,
  children,
  className,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const loading = externalLoading ?? internalLoading;
  const resolvedDescription = description ?? desc;
  const resolvedVariant =
    variant ?? (destructive ? "destructive" : "default");
  const resolvedCancelText = cancelText ?? cancelBtnText ?? "Cancel";
  const resolvedOnConfirm = handleConfirm ?? onConfirm;

  const handleConfirmClick = async () => {
    if (!resolvedOnConfirm) return;
    try {
      setInternalLoading(true);
      await resolvedOnConfirm();
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {resolvedDescription ? (
            <DialogDescription>{resolvedDescription}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children ? <div className="space-y-3">{children}</div> : null}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {resolvedCancelText}
          </Button>
          <Button
            type="button"
            variant={resolvedVariant === "destructive" ? "destructive" : "default"}
            disabled={loading || disabled}
            onClick={handleConfirmClick}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<PendingConfirm | null>(null);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open && pending) {
      pending.resolve(false);
      setPending(null);
    }
  };

  const handleConfirm = async () => {
    if (pending) {
      pending.resolve(true);
      setPending(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={handleOpenChange}
        title={pending?.title ?? ""}
        description={pending?.description}
        confirmText={pending?.confirmText}
        cancelText={pending?.cancelText}
        variant={pending?.variant}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);

  const fallbackConfirm = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      const ok = window.confirm(
        opts.description ? `${opts.title}\n\n${opts.description}` : opts.title
      );
      resolve(ok);
    });
  }, []);

  return ctx?.confirm ?? fallbackConfirm;
}
