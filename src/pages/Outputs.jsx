import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Archive, Search, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import AgentAvatar from "../components/shared/AgentAvatar";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function Outputs() {
  const [outputs, setOutputs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [o, a] = await Promise.all([
      base44.entities.Output.list("-created_date", 100),
      base44.entities.Agent.list(),
    ]);
    setOutputs(o);
    setAgents(a);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (output) => {
    await base44.entities.Output.update(output.id, { status: "approved" });
    toast.success("Output approved!");
    loadData();
    setSelected(null);
  };

  const handleReject = async (output) => {
    await base44.entities.Output.update(output.id, { status: "draft", feedback: "Needs revision" });
    toast("Output sent back for revision");
    loadData();
    setSelected(null);
  };

  const filtered = outputs.filter(o => {
    const matchSearch = o.title?.toLowerCase().includes(search.toLowerCase()) || o.content?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.status === filter;
    return matchSearch && matchFilter;
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
      <PageHeader title="Output Vault" subtitle="All deliverables from your executive team" />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search outputs..." className="pl-10 bg-card" />
        </div>
        <div className="flex gap-1">
          {["all", "draft", "in_review", "approved", "published"].map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs capitalize"
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">No outputs yet</p>
          <p className="text-sm text-muted-foreground mt-1">Outputs will appear here as your agents complete tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(output => {
            const agent = agents.find(a => a.id === output.agent_id);
            return (
              <div
                key={output.id}
                onClick={() => setSelected(output)}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4"
              >
                {agent && <AgentAvatar agent={agent} size="sm" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{output.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{output.content?.slice(0, 100)}</p>
                </div>
                <StatusBadge status={output.status} />
                <StatusBadge status={output.output_type || "content"} />
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.output_type || "content"} />
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                  {selected.content}
                </ReactMarkdown>
              </div>
              {selected.status === "in_review" && (
                <div className="flex gap-3">
                  <Button onClick={() => handleApprove(selected)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4" /> Approve
                  </Button>
                  <Button onClick={() => handleReject(selected)} variant="destructive" className="flex-1 gap-2">
                    <X className="w-4 h-4" /> Request Revision
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}