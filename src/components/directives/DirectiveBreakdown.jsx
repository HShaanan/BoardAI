import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, User2, Loader2 } from "lucide-react";
import AgentAvatar from "../shared/AgentAvatar";
import StatusBadge from "../shared/StatusBadge";

const PRIORITY_COLORS = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export default function DirectiveBreakdown({ directive, agentMap, tasks }) {
  const [expanded, setExpanded] = useState(true);
  const directiveTasks = tasks.filter(t => t.directive_id === directive.id);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={directive.priority} />
            <StatusBadge status={directive.status} />
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(directive.created_date).toLocaleDateString("he-IL")}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground border-l-2 border-accent pl-3 leading-relaxed">
            {directive.content}
          </p>
          {directiveTasks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {directiveTasks.length} משימות הוקצו ל-{[...new Set(directiveTasks.map(t => t.assigned_agent_role_key).filter(Boolean))].length} סוכנים
            </p>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
      </button>

      {/* Task Breakdown */}
      {expanded && directiveTasks.length > 0 && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">משימות שנוצרו</p>
          {directiveTasks.map(task => {
            const agent = task.assigned_agent_role_key ? agentMap[task.assigned_agent_role_key] : null;
            return (
              <div key={task.id} className="flex items-start gap-3 bg-background/50 rounded-lg p-3 border border-border/50">
                <div className="shrink-0 mt-0.5">
                  {agent ? <AgentAvatar agent={agent} size="sm" /> : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold" style={{ color: agent?.color || "hsl(var(--muted-foreground))" }}>
                      {agent?.title_he || agent?.title || task.assigned_agent_role_key || "Unassigned"}
                    </p>
                    <span className={`text-[10px] font-medium ${PRIORITY_COLORS[task.priority] || "text-muted-foreground"}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
                  )}
                </div>
                <StatusBadge status={task.status} />
              </div>
            );
          })}
        </div>
      )}

      {/* Processing state */}
      {expanded && directive.status === "issued" && directiveTasks.length === 0 && (
        <div className="border-t border-border px-5 py-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Chief of Staff מעבד את ה-Directive...</span>
        </div>
      )}

      {/* Parsed but no tasks */}
      {expanded && directive.status === "parsed" && directiveTasks.length === 0 && directive.ai_response && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground mb-2">ניתוח Chief of Staff:</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{directive.ai_response?.slice(0, 300)}...</p>
        </div>
      )}
    </div>
  );
}