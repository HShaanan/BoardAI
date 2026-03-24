import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

const TYPE_COLORS = {
  decision: "bg-blue-500/20 text-blue-400",
  lesson: "bg-green-500/20 text-green-400",
  preference: "bg-purple-500/20 text-purple-400",
  feedback: "bg-yellow-500/20 text-yellow-400",
};

export default function Memory() {
  const [entries, setEntries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ content: "", memory_type: "lesson", agent_id: "" });

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
    if (!form.content.trim()) return;
    await base44.entities.MemoryEntry.create({
      ...form,
      is_active: true,
      agent_id: form.agent_id || undefined,
    });
    toast.success("Memory saved!");
    setForm({ content: "", memory_type: "lesson", agent_id: "" });
    setShowAdd(false);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.MemoryEntry.delete(id);
    toast.success("Memory removed");
    loadData();
  };

  const filtered = entries.filter(e =>
    e.content.toLowerCase().includes(search.toLowerCase())
  );

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
        title="Memory Log"
        subtitle="Institutional memory — past decisions, lessons, and preferences"
        action={
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Memory
          </Button>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search memories..." className="pl-10 bg-card" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">No memories recorded yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add lessons, decisions, and preferences to help your agents learn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const agent = agents.find(a => a.id === entry.agent_id);
            return (
              <div key={entry.id} className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[entry.memory_type]}`}>
                        {entry.memory_type}
                      </span>
                      {agent && (
                        <span className="text-xs text-muted-foreground">{agent.title}</span>
                      )}
                      {!entry.agent_id && (
                        <span className="text-xs text-muted-foreground">Global</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{entry.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
              <Select value={form.memory_type} onValueChange={(v) => setForm(p => ({ ...p, memory_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="lesson">Lesson</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Agent (optional)</label>
              <Select value={form.agent_id || "global"} onValueChange={(v) => setForm(p => ({ ...p, agent_id: v === "global" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (all agents)</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Content</label>
              <Textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} placeholder="What should be remembered?" rows={4} />
            </div>
            <Button onClick={handleAdd} className="w-full">Save Memory</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}