import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-sm border border-pine-100 bg-white p-6 ${className}`} {...props} />;
}
