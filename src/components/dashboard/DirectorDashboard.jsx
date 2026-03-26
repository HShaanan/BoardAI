import { Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import CalendarWidget from "./CalendarWidget";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function DirectorDashboard({ agents, tasks, projects }) {
  const today = new Date().toLocaleDateString("he-IL");
  
  // משימות דחופות היום
  const urgentTasks = tasks
    .filter(t => t.status !== "done" && (t.priority === "critical" || t.priority === "high"))
    .slice(0, 5);

  // תוצאות של סוכנים היום
  const completedToday = tasks.filter(t => {
    const created = new Date(t.created_date);
    const now = new Date();
    return t.status === "done" && created.toDateString() === now.toDateString();
  });

  // סוכנים פעילים
  const activeAgents = agents.filter(a => a.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">מזער דירקטור</h2>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
        <Link to="/directives">
          <Button className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
            <Target className="w-4 h-4 mr-2" /> הנחיה חדשה
          </Button>
        </Link>
      </div>

      {/* כרטיסיות סטטיסטיקה */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-sm text-muted-foreground">סוכנים פעילים</div>
          <div className="text-2xl font-bold text-foreground mt-2">{activeAgents.length}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-sm text-muted-foreground">משימות דחופות</div>
          <div className="text-2xl font-bold text-destructive mt-2">{urgentTasks.length}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-sm text-muted-foreground">הושלמו היום</div>
          <div className="text-2xl font-bold text-success mt-2">{completedToday.length}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-sm text-muted-foreground">פרויקטים פעילים</div>
          <div className="text-2xl font-bold text-primary mt-2">{projects.filter(p => p.status === "active").length}</div>
        </div>
      </div>

      {/* משימות דחופות */}
      {urgentTasks.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">משימות דחופות להיום</h3>
          </div>
          <div className="space-y-3">
            {urgentTasks.map(task => {
              const agent = agents.find(a => a.id === task.assigned_agent_id);
              return (
                <div key={task.id} className="flex items-start justify-between p-3 bg-secondary/20 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    {agent && <p className="text-xs text-muted-foreground mt-1">{agent.title_he || agent.title}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                    task.priority === "critical" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                  }`}>
                    {task.priority === "critical" ? "דחוף" : "גבוה"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* תוצאות סוכנים */}
      {completedToday.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">תוצאות היום</h3>
          </div>
          <div className="space-y-3">
            {completedToday.slice(0, 5).map(task => {
              const agent = agents.find(a => a.id === task.assigned_agent_id);
              return (
                <div key={task.id} className="flex items-start justify-between p-3 bg-success/10 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    {agent && <p className="text-xs text-muted-foreground mt-1">{agent.title_he || agent.title}</p>}
                  </div>
                  <span className="text-xs text-success font-semibold">✓ הושלם</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* יומן */}
      <CalendarWidget />

      {/* סוכנים פעילים */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">הצוות שלך</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeAgents.map(agent => {
            const agentTasks = tasks.filter(t => t.assigned_agent_id === agent.id);
            const completed = agentTasks.filter(t => t.status === "done").length;
            return (
              <div key={agent.id} className="p-3 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{agent.avatar_emoji || "🤖"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{agent.title_he || agent.title}</p>
                    <p className="text-xs text-muted-foreground">{agent.department}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {completed} משימה הושלמה • {agentTasks.length} בעבודה
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}