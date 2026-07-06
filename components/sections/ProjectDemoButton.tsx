"use client";

import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type DemoActionType = "external" | "open-chat" | "scroll";

type ProjectDemoButtonProps = {
  label: string;
  type?: DemoActionType | null;
  target?: string | null;
  className?: string;
  variant?: "primary" | "secondary";
};

export function ProjectDemoButton({
  label,
  type,
  target,
  className,
  variant = "primary",
}: ProjectDemoButtonProps) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const styles = cn(
    "text-center px-4 py-2 rounded-lg transition-colors text-sm font-medium",
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border hover:bg-accent",
    className,
  );

  if (type === "open-chat") {
    return (
      <button
        type="button"
        className={styles}
        onClick={() => (isMobile ? setOpenMobile(true) : setOpen(true))}
      >
        {label}
      </button>
    );
  }

  if (type === "scroll" && target) {
    return (
      <button
        type="button"
        className={styles}
        onClick={() => {
          document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        {label}
      </button>
    );
  }

  if (target) {
    const isExternal = target.startsWith("http");

    if (isExternal) {
      return (
        <Link
          href={target}
          target="_blank"
          rel="noopener noreferrer"
          className={styles}
        >
          {label}
        </Link>
      );
    }

    return (
      <Link href={target} className={styles}>
        {label}
      </Link>
    );
  }

  return null;
}
