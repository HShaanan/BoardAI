import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, X, Check, Loader2 } from "lucide-react";

export default function ExportOutputModal({ topic, activeAgents, decisions, onClose }) {
  const participantNames = activeAgents.map(a => a.title).join(", ");
  const decisionsList = decisions.map((d, i) => `${i + 1}. ${d.directive_text} (אחראי: ${d.agent_role_key}, עדיפות: ${d.priority})`).join("\n");

  const defaultContent = `# סיכום ישיבת דירקטוריון
**נושא:** ${topic}
**תאריך:** ${new Date().toLocaleDateString("he-IL")}
**משתתפים:** ${participantNames}

---

## החלטות שהתקבלו

${decisionsList || "לא זוהו החלטות מפורשות."}

---

## הערות נוספות

`;

  const [content, setContent] = useState(defaultContent);
  const [title, setTitle] = useState(`סיכום ישיבה: ${topic}`);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Output.create({
      title,
      content,
      output_type: "report",
      status: "draft",
    });
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">ייצוא סיכום לOutput</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת הסיכום</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              dir="auto"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן הסיכום (ניתן לעריכה)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={16}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-none"
              dir="auto"
            />
          </div>

          <div className="bg-secondary/40 rounded-xl p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">משתתפים:</span> {participantNames}
            <br />
            <span className="font-medium text-foreground">החלטות שזוהו:</span> {decisions.length}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || saved || !title.trim()} className="flex-1 rounded-xl gap-2">
            {saved ? (
              <><Check className="w-4 h-4" /> נשמר!</>
            ) : saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</>
            ) : (
              <><FileText className="w-4 h-4" /> שמור כ-Output</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}