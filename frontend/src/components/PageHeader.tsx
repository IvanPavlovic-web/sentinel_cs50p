import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-ops-border">
      <h1
        className="flex-1 font-display text-[1.6rem] sm:text-[2.1rem] md:text-[2.5rem] font-semibold tracking-tight leading-[0.92] text-ops-accent truncate min-w-0 max-w-full"
        title={title}
      >
        {title}
      </h1>
      {actions && <div className="flex items-center gap-3 pb-1 shrink-0">{actions}</div>}
    </header>
  );
}
