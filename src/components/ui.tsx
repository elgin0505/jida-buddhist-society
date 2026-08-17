import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div className={`card p-6 ${hover ? "card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "golden" | "jade" | "sapphire" | "carmine";
}

const accentStyles = {
  golden: "bg-golden-deep/10 text-golden-rich",
  jade: "bg-jade/10 text-jade",
  sapphire: "bg-sapphire/10 text-sapphire",
  carmine: "bg-carmine/10 text-carmine",
};

export function StatCard({ label, value, icon, accent = "golden" }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted dark:text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-charcoal dark:text-white">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ 
  children, 
  variant = "golden",
  className = "" 
}: { 
  children: React.ReactNode; 
  variant?: "golden" | "jade" | "sapphire" | "carmine";
  className?: string;
}) {
  const styles = {
    golden: "bg-golden-deep/10 text-golden-rich border-golden-deep/20",
    jade: "bg-jade/10 text-jade border-jade/20",
    sapphire: "bg-sapphire/10 text-sapphire border-sapphire/20",
    carmine: "bg-carmine/10 text-carmine border-carmine/20",
  };

  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ocher-light/40 dark:bg-slate-800 text-golden-rich">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-charcoal dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted dark:text-slate-400">{description}</p>
    </div>
  );
}

export function MemberAvatar({
  name,
  photo,
  size = "md",
}: {
  name: string;
  photo?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-16 w-16 text-xl",
    lg: "h-24 w-24 text-3xl",
  };

  const initials = name
    .split("")
    .filter((c) => c.trim())
    .slice(0, 1)
    .join("");

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-golden-deep/20`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-golden-deep to-ocher font-bold text-white ring-2 ring-golden-deep/20`}
    >
      {initials}
    </div>
  );
}
