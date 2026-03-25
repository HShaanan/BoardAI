import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Trash2, CheckCircle2, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  on_track: { label: "On Track", icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  at_risk: { label: "At Risk", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  achieved: { label: "Achieved", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  missed: { label: "Missed", icon: Clock, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
};

const EMPTY_GOAL = { title: "", target: "", current: "", unit: "", due_date: "", status: "on_track" };

export default function AgentGoalsPanel({ agent, onUpdate }) {
  const [goals, setGoals] = useState(agent.goals || []);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ ...EMPTY_GOAL });
  const [saving, setSaving] = useState(false);

  const saveGoals = async (updated) => {
    setSaving(true);
    await base44.entities.Agent.update(agent.id, { goals: updated });
    setGoals(updated);
    onUpdate?.({ ...agent, goals: updated });
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newGoal.title.trim()) return;
    const updated = [...goals, newGoal];
    await saveGoals(updated);
    setNewGoal({ ...EMPTY_GOAL });
    setAdding(false);
  };

  const handleDelete = async (idx) => {
    const updated = goals.filter((_, i) => i !== idx);
    await saveGoals(updated);
  };

  const handleStatusChange = async (idx, status) => {
    const updated = goals.map((g, i) => i === idx ? { ...g, status } : g);
    await saveGoals(updated);
  };

  const handleCurrentChange = async (idx, current) => {
    const updated = goals.map((g, i) => i === idx ? { ...g, current } : g);
    await saveGoals(updated);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" /> Goals & KPIs ({goals.length})
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setAdding(true)} className="gap-1 text-xs h-7">
          <Plus className="w-3 h-3" /> Add Goal
        </Button>
      </div>

      {goals.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-4">No goals assigned yet.</p>
      )}

      <div className="space-y-3">
        {goals.map((goal, idx) => {
          const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.on_track;
          const Icon = cfg.icon;
          const progress = goal.target && goal.current
            ? Math.min(100, Math.round((parseFloat(goal.current) / parseFloat(goal.target)) * 100))
            : null;

          return (
            <div key={idx} className={`rounded-xl border p-3 ${cfg.bg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                    <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {goal.target && (
                      <span>
                        Target: <span className="text-foreground font-medium">{goal.target}{goal.unit}</span>
                      </span>
                    )}
                    {goal.current !== undefined && goal.current !== "" && (
                      <span className="flex items-center gap-1">
                        Current:
                        <input
                          className="w-14 bg-transparent border-b border-border text-foreground font-medium text-xs focus:outline-none"
                          value={goal.current}
                          onChange={e => {
                            const updated = goals.map((g, i) => i === idx ? { ...g, current: e.target.value } : g);
                            setGoals(updated);
                          }}
                          onBlur={() => handleCurrentChange(idx, goals[idx].current)}
                        />
                        {goal.unit}
                      </span>
                    )}
                    {goal.due_date && <span>Due: {new Date(goal.due_date).toLocaleDateString()}</span>}
                  </div>
                  {progress !== null && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: progress >= 100 ? "#4ade80" : progress >= 70 ? "#60a5fa" : "#f59e0b" }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{progress}% complete</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={goal.status}
                    onChange={e => handleStatusChange(idx, e.target.value)}
                    className="text-[10px] bg-transparent border border-border rounded px-1 py-0.5 text-muted-foreground focus:outline-none"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button onClick={() => handleDelete(idx)} className="p-1 hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="mt-3 bg-secondary/50 rounded-xl p-3 space-y-2 border border-border">
          <input
            autoFocus
            placeholder="Goal title (e.g. Increase MQL by 30%)"
            value={newGoal.title}
            onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border pb-1"
          />
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Target" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))}
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none border border-border rounded px-2 py-1" />
            <input placeholder="Unit (%,€,$)" value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))}
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none border border-border rounded px-2 py-1" />
            <input type="date" value={newGoal.due_date} onChange={e => setNewGoal(p => ({ ...p, due_date: e.target.value }))}
              className="bg-transparent text-xs text-foreground focus:outline-none border border-border rounded px-2 py-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving} className="h-7 text-xs">Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}