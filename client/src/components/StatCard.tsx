import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-brown-border bg-cream-dark p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-brown-muted">{label}</span>
        <Icon className="h-5 w-5 text-brown-muted" />
      </div>
      <p className="text-3xl font-semibold tracking-tight text-brown">{value}</p>
    </div>
  );
}
