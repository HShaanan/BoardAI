import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

const PRIORITY_COLORS = {
  critical: "hsl(var(--chart-5))",
  high: "hsl(var(--chart-3))",
  medium: "hsl(var(--chart-1))",
  low: "hsl(var(--muted-foreground))",
};
const PRIORITY_LABELS = { critical: "קריטי", high: "גבוה", medium: "בינוני", low: "נמוך" };

export default function BoardMeetingStats({ directives, conversations }) {
  const meetingCount = conversations.filter(c => c.type === "meeting").length;
  const totalDecisions = directives.length;
  const recentDecisions = directives.slice(0, 5);

  // Priority breakdown
  const priorityCounts = directives.reduce((acc, d) => {
    const p = d.priority || "medium";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(priorityCounts).map(([key, value]) => ({
    name: PRIORITY_LABELS[key] || key,
    value,
    color: PRIORITY_COLORS[key] || "hsl(var(--chart-1))",
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Meeting counter + pie */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">ישיבות דירקטוריון</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">סה"כ ישיבות שהתקיימו</p>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{meetingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">ישיבות</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              <span>{totalDecisions} החלטות סה"כ</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-chart-2" />
              <span>
                {directives.filter(d => d.status === "completed").length} הושלמו
              </span>
            </div>
          </div>
        </div>

        {pieData.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] text-muted-foreground mb-2">התפלגות עדיפויות</p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent decisions */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">החלטות אחרונות</h3>
        <p className="text-xs text-muted-foreground mb-4">מהדיונים האחרונים</p>

        {recentDecisions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            אין החלטות עדיין
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentDecisions.map((d, i) => (
              <div key={d.id} className="flex gap-2.5 items-start">
                <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 mt-0.5">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{d.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full`}
                      style={{ background: `${PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.medium}20`, color: PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.medium }}>
                      {PRIORITY_LABELS[d.priority] || "בינוני"}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(d.created_date).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}