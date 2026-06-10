import Link from 'next/link';
import { ChevronRight, Lightbulb } from 'lucide-react';

/**
 * Shared building blocks for help-centre, pricing, and legal pages so they all
 * share the same hero, typography rhythm, and spacing.
 */

export function ArticleHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden gradient-hero text-white">
      <div className="absolute inset-0 bg-dot-grid" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl max-w-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

export function ArticleBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">{children}</div>
  );
}

export function ArticleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12 last:mb-0">
      <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
        {n}
      </div>
      <div className="pt-0.5">
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export function StepList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed">
      <Lightbulb className="h-4 w-4 shrink-0 text-accent mt-0.5" />
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

/** Expandable FAQ item — native <details>, no client JS required. */
export function FaqItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border/60 bg-background px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground">
        {question}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function GuideLinkCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border/60 bg-background p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-display text-lg font-bold tracking-tight mb-1">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground flex-1">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Read the guide
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
