"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

export function Logo({ className }: { className?: string }) {
  const { config } = useTheme();

  if (config.logoUrl) {
    return (
      <img
        src={config.logoUrl}
        alt="Logo"
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-sky-600", className)}
      aria-hidden="true"
    >
      <path
        d="M50 6a44 44 0 0 1 44 44 44 44 0 0 1-13 31"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M18 44c8-3 17-2 24 3l10 7 6-14c3-7 9-12 16-14-3 8-4 16-3 24l14-4c-4 9-11 16-20 20l-13 5 3 13-11-9-9 11-1-14-16-6c-4-2-7-5-8-9l8-3-8-6c2-3 5-4 8-4z"
        fill="currentColor"
      />
    </svg>
  );
}

