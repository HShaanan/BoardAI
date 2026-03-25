import { useState } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import AgentAvatar from "../shared/AgentAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRIORITY_COLORS = {
  critical: "text-destructive bg-destructive/10",
  high: "text-warning bg-warning/10",
  medium: "text-primary bg-primary/10",
  low: "text-muted-foreground bg-secondary",
};

const PRIORITY_LABELS = { critical: "קריטי", high: "גבוה", medium: "בינוני", low: "נמוך" };

const STATUS_OPTIONS = [
  { value: "todo", label: "לביצוע" },
  { value: "in_progress", label: "בביצוע" },
  { value: "review", label: "בסקירה" },
  { value: "approved", label: "אושר" },
  { value: "done", label: "הושלם" },
  { value: "rejected", label: "נדחה" },
];

export default function TaskCard({ task, agent, directive, agents, onStatusChange, onDelete }) {
  const [changing, setChanging] = useState(false);

  const handleStatus = async (val) => {
    setChanging(true);
    await onStatusChange(task.id, val);
    setChanging(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-3 space-y-2.5 hover:border-primary/30 transition-colors">
      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Directive link */}
      {directive && (
        <div className="text-[10px] text-muted-foreground bg-accent/10 rounded-lg px-2 py-1 border-l-2 border-accent">
          מתוך: {directive.content?.slice(0, 60)}...
        </div>
      )}

      {/* Priority + Status row */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || "bg-secondary text-muted-foreground"}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>

        <div className="flex-1">
          <Select value={task.status} onValueChange={handleStatus} disabled={changing}>
            <SelectTrigger className="h-6 text-[10px] rounded-lg border-border bg-secondary/50 px-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Agent */}
      {agent && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
          <AgentAvatar agent={agent} size="sm" />
          <span className="text-[11px] text-muted-foreground">{agent.title_he || agent.title}</span>
        </div>
      )}
    </div>
  );
}