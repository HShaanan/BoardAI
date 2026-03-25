import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, X, Check, Loader2, Users, Zap, ChevronDown } from "lucide-react";

const OUTPUT_TYPES = [
  { value: "report", label: "דוח" },
  { value: "strategy", label: "אסטרטגיה" },
  { value: "analysis", label: "ניתוח" },
];

export default function ExportOutputModal({ topic, activeAgents, decisions, onClose }) {
  const participantNames = activeAgents.map(a => a.title_he || a.title).join(", ");

  const resolveAgent = (role_key) => {
    const found = activeAgents.find(a => a.role_key === role_key);
    return found ? (found.title_he || found.title) : role_key;
  };

  const decisionsList = decisions.length > 0
    ? decisions.map((d, i) =>
        `${i + 1}. ${d.directive_text}\n   → אחראי: ${resolveAgent(d.agent_role_key)} | עדיפות: ${
          d.priority === "critical" ? "קריטי" :
          d.priority === "high" ? "גבוה" :
          d.priority === "low" ? "נמוך" : "בינוני"
        }`
      ).join("\n\n")
    : "לא זוהו החלטות מפורשות.";

  const defaultContent = `# סיכום ישיבת דירקטוריון

**נושא:** ${topic}
**תאריך:** ${new Date().toLocaleDateString("he-IL")}
**משתתפים:** ${participantNames}

---

## החלטות שהתקבלו

${decisionsList}

---

## הערות נוספות

`;

  const [content, setContent] = useState(defaultContent);
  const [title, setTitle] = useState(`סיכום ישיבה: ${topic}`);
  const [outputType, setOutputType] = useState("report");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Output.create({
      title,
      content,
      output_type: outputType,
      status: "draft",
    });
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">ייצוא סיכום דיון</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/40 rounded-xl p-3 flex items-start gap-2">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">משתתפים</p>
                <p className="text-xs text-foreground font-medium leading-snug">{participantNames || "—"}</p>
              </div>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">החלטות שזוהו</p>
                <p className="text-xs text-foreground font-medium">{decisions.length} החלטות</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת הסיכום</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              dir="auto"
            />
          </div>

          {/* Output type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">סוג Output</label>
            <div className="relative">
              <select
                value={outputType}
                onChange={e => setOutputType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                {OUTPUT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Content editor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">תוכן הסיכום (ניתן לעריכה)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={16}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-none leading-relaxed"
              dir="auto"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || saved || !title.trim()} className="flex-1 rounded-xl gap-2">
            {saved ? (
              <><Check className="w-4 h-4" /> נשמר בהצלחה!</>
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