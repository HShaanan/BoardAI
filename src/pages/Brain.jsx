import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Brain as BrainIcon, Plus, Search, FileText, Link2, StickyNote, Image, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

const SOURCE_ICONS = { document: FileText, url: Link2, note: StickyNote, image: Image };

export default function Brain() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", source_type: "note", category: "", tags: [] });

  const loadEntries = async () => {
    const items = await base44.entities.BrainEntry.list("-created_date", 100);
    setEntries(items);
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    await base44.entities.BrainEntry.create(form);
    toast.success("Knowledge added to Brain!");
    setForm({ title: "", content: "", source_type: "note", category: "", tags: [] });
    setShowAdd(false);
    loadEntries();
  };

  const handleDelete = async (id) => {
    await base44.entities.BrainEntry.delete(id);
    toast.success("Entry removed");
    loadEntries();
  };

  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase()) ||
    (e.category || "").toLowerCase().includes(search.toLowerCase())
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
        title="The Brain"
        subtitle="Knowledge base — upload documents, URLs, and notes to feed your agents"
        action={
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Knowledge
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge base..."
          className="pl-10 bg-card"
        />
      </div>

      {/* Entries Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BrainIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">No knowledge entries yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add documents, URLs, or notes to help your agents work better</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(entry => {
            const Icon = SOURCE_ICONS[entry.source_type] || FileText;
            return (
              <div key={entry.id} className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{entry.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{entry.content}</p>
                {entry.category && (
                  <span className="inline-block mt-3 px-2 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground">
                    {entry.category}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Knowledge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title</label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Entry title" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
              <Select value={form.source_type} onValueChange={(v) => setForm(p => ({ ...p, source_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
              <Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g., Market Research" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Content</label>
              <Textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Knowledge content..." rows={6} />
            </div>
            <Button onClick={handleAdd} className="w-full">Add to Brain</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}