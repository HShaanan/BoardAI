import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AgentPerformanceChart({ agents, tasks }) {
  const data = agents
    .filter(a => a.is_active)
    .map(a => {
      const agentTasks = tasks.filter(t => t.assigned_agent_id === a.id);
      const done = agentTasks.filter(t => t.status === "done").length;
      const inProgress = agentTasks.filter(t => t.status === "in_progress").length;
      return {
        name: a.avatar_emoji + " " + (a.title_he || a.title).split(" ").slice(0, 2).join(" "),
        הושלם: done,
        בביצוע: inProgress,
        סה_כ: agentTasks.length,
        color: a.color || "#3B82F6",
      };
    })
    .filter(d => d.סה_כ > 0)
    .sort((a, b) => b.סה_כ - a.סה_כ)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">ביצועי סוכנים</h3>
        <p className="text-xs text-muted-foreground mb-4">פעילות לפי משימות</p>
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          אין נתוני משימות עדיין
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">ביצועי סוכנים</h3>
      <p className="text-xs text-muted-foreground mb-4">פעילות לפי משימות</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={100} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Bar dataKey="הושלם" stackId="a" radius={[0, 0, 0, 0]} fill="hsl(var(--chart-2))" />
          <Bar dataKey="בביצוע" stackId="a" radius={[0, 4, 4, 0]} fill="hsl(var(--chart-1))" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 justify-end">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm bg-chart-2" /> הושלם
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm bg-chart-1" /> בביצוע
        </div>
      </div>
    </div>
  );
}