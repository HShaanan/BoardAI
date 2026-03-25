import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

export default function TaskStatusChart({ tasks }) {
  // Build last 7 days activity
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, "MM/dd");
    const dayTasks = tasks.filter(t => {
      const d = new Date(t.created_date);
      return format(d, "MM/dd") === dayStr;
    });
    return {
      day: format(date, "dd/MM"),
      "משימות חדשות": dayTasks.length,
      "הושלמו": dayTasks.filter(t => t.status === "done").length,
    };
  });

  const totalTasks = tasks.length;
  const byStatus = {
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
    review: tasks.filter(t => t.status === "review").length,
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">פעילות משימות</h3>
      <p className="text-xs text-muted-foreground mb-4">7 ימים אחרונים</p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "לביצוע", value: byStatus.todo, color: "text-muted-foreground" },
          { label: "בביצוע", value: byStatus.in_progress, color: "text-primary" },
          { label: "בסקירה", value: byStatus.review, color: "text-warning" },
          { label: "הושלמו", value: byStatus.done, color: "text-success" },
        ].map(s => (
          <div key={s.label} className="text-center bg-secondary/40 rounded-lg p-2">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={days} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
          />
          <Area type="monotone" dataKey="משימות חדשות" stroke="hsl(var(--chart-1))" fill="url(#colorNew)" strokeWidth={2} />
          <Area type="monotone" dataKey="הושלמו" stroke="hsl(var(--chart-2))" fill="url(#colorDone)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}