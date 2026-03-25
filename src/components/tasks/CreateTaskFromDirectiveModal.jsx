import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, CheckSquare, Loader2 } from "lucide-react";
import AgentAvatar from "../shared/AgentAvatar";

export default function CreateTaskFromDirectiveModal({ directives, agents, onClose, onCreated }) {
  const [selectedDirective, setSelectedDirective] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  const handleDirectiveChange = (id) => {
    setSelectedDirective(id);
    const d = directives.find(d => d.id === id);
    if (d) {
      setTitle(d.content?.slice(0, 80) || "");
      setDescription(d.ai_response?.slice(0, 200) || "");
      setPriority(d.priority || "medium");
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedAgent) return;
    setSaving(true);
    await base44.entities.Task.create({
      title: title.trim(),
      description: description.trim(),
      assigned_agent_id: selectedAgent,
      status: "todo",
      priority,
      project_id: selectedDirective || undefined, // store directive ref in project_id
    });

    // Update directive status to in_progress if linked
    if (selectedDirective) {
      await base44.entities.Directive.update(selectedDirective, { status: "in_progress" });
    }

    setSaving(false);
    onCreated();
  };

  const PRIORITY_LABELS = { low: "נמוך", medium: "בינוני", high: "גבוה", critical: "קריטי" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">הקצאת משימה מהחלטה</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Link to directive */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">קשר להחלטה (אופציונלי)</label>
            <Select value={selectedDirective} onValueChange={handleDirectiveChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="בחר החלטה מהדיון..." />
              </SelectTrigger>
              <SelectContent>
                {directives.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="text-xs">{d.content?.slice(0, 60)}...</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת המשימה</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="מה צריך לעשות?"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              dir="auto"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">תיאור (אופציונלי)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="פרטים נוספים על המשימה..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              dir="auto"
            />
          </div>

          {/* Agent + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">הקצה לסוכן</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="בחר סוכן..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-1.5 text-xs">
                        <span>{a.avatar_emoji}</span>
                        <span>{a.title_he || a.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">עדיפות</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">ביטול</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !selectedAgent}
            className="flex-1 rounded-xl gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</> : <><CheckSquare className="w-4 h-4" /> צור משימה</>}
          </Button>
        </div>
      </div>
    </div>
  );
}