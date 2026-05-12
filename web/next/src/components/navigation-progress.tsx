"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationProgressInnerProps {
  className?: string;
}

function NavigationProgressInner({ className }: NavigationProgressInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const firstRender = React.useRef(true);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    clearTimers();
    setVisible(true);
    setProgress(10);

    timersRef.current.push(setTimeout(() => setProgress(40), 80));
    timersRef.current.push(setTimeout(() => setProgress(75), 200));
    timersRef.current.push(setTimeout(() => setProgress(95), 400));
    timersRef.current.push(
      setTimeout(() => {
        setProgress(100);
        timersRef.current.push(
          setTimeout(() => {
            setVisible(false);
            setProgress(0);
          }, 200)
        );
      }, 500)
    );

    return clearTimers;
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-[9999] h-0.5",
        className
      )}
    >
      <div
        className="h-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

export function NavigationProgress(props: NavigationProgressInnerProps) {
  return (
    <React.Suspense fallback={null}>
      <NavigationProgressInner {...props} />
    </React.Suspense>
  );
}
