import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, Zap, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DecisionPanel({ decisions, agents, onDirectiveCreated }) {
  const [creating, setCreating] = useState({});
  const [created, setCreated] = useState({});
  const [dismissed, setDismissed] = useState({});
  const [expanded, setExpanded] = useState(true);

  const visible = decisions.filter((_, i) => !dismissed[i]);
  if (visible.length === 0) return null;

  const handleCreate = async (decision, idx) => {
    setCreating(prev => ({ ...prev, [idx]: true }));
    const agent = agents.find(a => a.role_key === decision.agent_role_key);
    const directive = await base44.entities.Directive.create({
      content: decision.directive_text,
      priority: decision.priority || "medium",
      status: "issued",
      ai_response: `הוקצה לסוכן: ${agent?.title || decision.agent_role_key}`
    });
    setCreated(prev => ({ ...prev, [idx]: true }));
    setCreating(prev => ({ ...prev, [idx]: false }));
    onDirectiveCreated?.(directive);
  };

  return (
    <div className="mx-4 mb-3 bg-card border border-accent/40 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">החלטות שהתקבלו בדיון ({visible.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {decisions.map((decision, idx) => {
            if (dismissed[idx]) return null;
            const agent = agents.find(a => a.role_key === decision.agent_role_key);
            const isCreated = created[idx];
            const isCreating = creating[idx];

            return (
              <div key={idx} className={`rounded-xl border p-3 transition-all ${isCreated ? "border-success/40 bg-success/5" : "border-border bg-background/50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{decision.directive_text}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {agent && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                          <span>{agent.avatar_emoji}</span>
                          <span>{agent.title}</span>
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        decision.priority === "critical" ? "bg-destructive/20 text-destructive" :
                        decision.priority === "high" ? "bg-warning/20 text-warning" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {decision.priority === "critical" ? "קריטי" : decision.priority === "high" ? "גבוה" : decision.priority === "low" ? "נמוך" : "בינוני"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isCreated && (
                      <button
                        onClick={() => setDismissed(prev => ({ ...prev, [idx]: true }))}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Button
                      size="sm"
                      variant={isCreated ? "ghost" : "default"}
                      onClick={() => !isCreated && handleCreate(decision, idx)}
                      disabled={isCreating || isCreated}
                      className="h-7 text-xs rounded-lg"
                    >
                      {isCreating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isCreated ? (
                        <><CheckCircle2 className="w-3 h-3 text-success" /> נוצר</>
                      ) : (
                        "→ Directive"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}