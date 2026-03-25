import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

const TYPE_LABELS = {
  decision: "החלטה",
  lesson: "שיעור",
  preference: "עדיפה",
  feedback: "משוב",
};

const TYPE_COLORS = {
  decision: "bg-blue-500/20 text-blue-400",
  lesson: "bg-green-500/20 text-green-400",
  preference: "bg-purple-500/20 text-purple-400",
  feedback: "bg-yellow-500/20 text-yellow-400",
};

const TAG_KEYWORDS = {
  "אסטרטגיה": ["תכנית", "אסטרטגיה", "תחזוקה", "מטרה", "כיוון"],
  "פיתוח": ["קוד", "פיתוח", "טכנולוגיה", "מערכת", "API"],
  "מכירות": ["חוזה", "לקוח", "מכירה", "הצעה", "עסקה"],
  "שיתוף פעולה": ["צוות", "שיתוף", "מפגש", "דיון", "קומוניקציה"],
  "תקציב": ["תקציב", "עלות", "הוצאה", "משאבים", "כספים"],
  "זמן": ["לוח זמנים", "דדליין", "תאריך", "לוח", "זמן"],
  "איכות": ["בדיקה", "איכות", "תקן", "שגיאה", "אימות"],
};

const generateTags = (content) => {
  const text = (content || "").toLowerCase();
  const tags = new Set();
  Object.entries(TAG_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some(kw => text.includes(kw))) {
      tags.add(tag);
    }
  });
  return Array.from(tags);
};

export default function Memory() {
  const [entries, setEntries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [form, setForm] = useState({ content: "", memory_type: "lesson", agent_id: "", title: "", subtitle: "" });
  const [selectedTags, setSelectedTags] = useState([]);

  const loadData = async () => {
    const [m, a] = await Promise.all([
      base44.entities.MemoryEntry.list("-created_date", 100),
      base44.entities.Agent.list(),
    ]);
    setEntries(m);
    setAgents(a);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!form.content.trim() || !form.title.trim()) return;
    await base44.entities.MemoryEntry.create({
      ...form,
      is_active: true,
      agent_id: form.agent_id || undefined,
    });
    toast.success("זיכרון נשמר✓");
    setForm({ content: "", memory_type: "lesson", agent_id: "", title: "", subtitle: "" });
    setShowAdd(false);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.MemoryEntry.delete(id);
    toast.success("זיכרון הוסר");
    setSelectedEntry(null);
    loadData();
  };

  const allTags = [...new Set(entries.flatMap(e => generateTags(e.content || "")))].sort();

  const filtered = entries.filter(e => {
    const matchesSearch = e.content.toLowerCase().includes(search.toLowerCase()) || (e.title && e.title.toLowerCase().includes(search.toLowerCase()));
    if (selectedTags.length === 0) return matchesSearch;
    const entryTags = generateTags(e.content || "");
    return matchesSearch && selectedTags.some(tag => entryTags.includes(tag));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="זיכרון"
        subtitle="זיכרון מוסדי — החלטות, שיעורים ועדיפויות"
        action={
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> הוסף
          </Button>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש בזיכרונות..." className="pl-10 bg-card" />
      </div>

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">אין זיכרונות עדיין</p>
          <p className="text-sm text-muted-foreground mt-1">הוסף שיעורים, החלטות ועדיפויות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const agent = agents.find(a => a.id === entry.agent_id);
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="w-full bg-card rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-secondary/20 transition-all group text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[entry.memory_type]}`}>
                        {TYPE_LABELS[entry.memory_type]}
                      </span>
                      {agent && (
                        <span className="text-xs text-muted-foreground">{agent.title_he || agent.title}</span>
                      )}
                      {!entry.agent_id && (
                        <span className="text-xs text-muted-foreground">גלובלי</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{entry.title || "בלי כותרת"}</p>
                    {entry.subtitle && <p className="text-xs text-muted-foreground mt-1">{entry.subtitle}</p>}
                    {generateTags(entry.content).length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {generateTags(entry.content).map(tag => (
                          <span key={tag} className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.created_date).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>הוסד זיכרון</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">עיר</label>
              <Select value={form.memory_type} onValueChange={(v) => setForm(p => ({ ...p, memory_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="decision">החלטה</SelectItem>
                  <SelectItem value="lesson">שיעור</SelectItem>
                  <SelectItem value="preference">עדיפה</SelectItem>
                  <SelectItem value="feedback">משוב</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">כותרת *</label>
              <input 
                type="text" 
                value={form.title} 
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} 
                placeholder="כותרת החלטה..." 
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">תת-כותרה</label>
              <input 
                type="text" 
                value={form.subtitle} 
                onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} 
                placeholder="תת-כותרה טטית (optional)" 
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">הסבר *</label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} 
                placeholder="הסבר מפורט..." 
                rows={4} 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">סוכן</label>
              <Select value={form.agent_id || "global"} onValueChange={(v) => setForm(p => ({ ...p, agent_id: v === "global" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">גלובלי</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.title_he || a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} className="w-full">שמור</Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[selectedEntry.memory_type]}`}>
                    {TYPE_LABELS[selectedEntry.memory_type]}
                  </span>
                  {agents.find(a => a.id === selectedEntry.agent_id) && (
                    <span className="text-xs text-muted-foreground">{agents.find(a => a.id === selectedEntry.agent_id)?.title_he || agents.find(a => a.id === selectedEntry.agent_id)?.title}</span>
                  )}
                </div>
                {generateTags(selectedEntry.content).length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {generateTags(selectedEntry.content).map(tag => (
                      <span key={tag} className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                )}
                <h2 className="text-2xl font-bold text-foreground">{selectedEntry.title || "בלי כותרת"}</h2>
                {selectedEntry.subtitle && <p className="text-sm text-muted-foreground mt-1">{selectedEntry.subtitle}</p>}
              </div>
              <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-3">הסבר:</p>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedEntry.content}</p>
              <div className="text-xs text-muted-foreground pt-6 border-t border-border mt-6">
                {new Date(selectedEntry.created_date).toLocaleDateString("he-IL")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}