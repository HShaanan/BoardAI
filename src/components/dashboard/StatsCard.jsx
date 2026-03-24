import { cn } from "@/lib/utils";

export default function StatsCard({ icon: Icon, label, value, trend, color }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color || 'hsl(var(--primary))'}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: color || 'hsl(var(--primary))' }} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}