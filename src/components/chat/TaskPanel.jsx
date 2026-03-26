import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, Plus, X, ChevronDown, Loader2, AlertCircle, Clock } from "lucide-react";

const STATUS_OPTIONS = ["todo", "in_progress", "review", "done"];
const STATUS_LABELS = { todo: "לביצוע", in_progress: "בתהליך", review: "סקירה", done: "הושלם" };
const PRIORITY_COLORS = { low: "bg-slate-400", medium: "bg-blue-500", high: "bg-orange-500", critical: "bg-red-500" };

function TaskRow({ task, agents, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const agent = agents.find(a => a.id === task.assigned_agent_id);

  const update = async (data) => {
    setSaving(true);
    await base44.entities.Task.update(task.id, data);
    onUpdate();
    setSaving(false);
  };

  const isDone = task.status === "done";

  return (
    <div className={`border-b border-border last:border-0 ${isDone ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button onClick={() => update({ status: isDone ? "todo" : "done" })} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isDone ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority] || "bg-slate-400"}`} />
            <p className={`text-sm font-medium text-foreground truncate ${isDone ? "line-through" : ""}`}>{task.title}</p>
          </div>
          {agent && <p className="text-xs text-muted-foreground mt-0.5">{agent.title_he || agent.title}</p>}
        </div>
        <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => update({ status: s })}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${task.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskPanel({ tasks, agents, onRefresh, onClose }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const activeTasks = tasks.filter(t => t.status !== "done");
  const doneTasks = tasks.filter(t => t.status === "done");

  const createTask = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    await base44.entities.Task.create({ title: newTitle.trim(), status: "todo", priority: "medium" });
    setNewTitle("");
    setShowCreate(false);
    onRefresh();
    setCreating(false);
  };

  return (
    <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col h-full">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">משימות פעילות</span>
          {activeTasks.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">{activeTasks.length}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowCreate(!showCreate)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="px-3 py-2 border-b border-border bg-secondary/30">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createTask(); if (e.key === "Escape") setShowCreate(false); }}
            placeholder="שם המשימה..."
            className="w-full text-sm bg-card border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
            style={{ direction: "rtl" }}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={createTask} disabled={!newTitle.trim() || creating}
              className="flex-1 text-xs bg-primary text-primary-foreground rounded-lg py-1.5 font-medium disabled:opacity-50 flex items-center justify-center gap-1">
              {creating && <Loader2 className="w-3 h-3 animate-spin" />}
              צור משימה
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 text-xs border border-border rounded-lg py-1.5 text-muted-foreground hover:text-foreground">ביטול</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTasks.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">אין משימות פעילות.<br />Boss AI ייצור משימות אוטומטית מהשיחה.</p>
          </div>
        )}
        {activeTasks.map(t => <TaskRow key={t.id} task={t} agents={agents} onUpdate={onRefresh} />)}
        {doneTasks.length > 0 && (
          <div className="px-3 py-1.5 border-t border-border mt-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">הושלמו ({doneTasks.length})</p>
            {doneTasks.slice(0, 5).map(t => <TaskRow key={t.id} task={t} agents={agents} onUpdate={onRefresh} />)}
          </div>
        )}
      </div>
    </div>
  );
}