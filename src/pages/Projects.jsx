import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import ProjectBoard from "../components/projects/ProjectBoard";
import { toast } from "sonner";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", objective: "", priority: "medium", status: "backlog" });

  const loadData = async () => {
    const [p, t, a] = await Promise.all([
      base44.entities.Project.list("-created_date", 50),
      base44.entities.Task.list("-created_date", 200),
      base44.entities.Agent.list(),
    ]);
    setProjects(p);
    setTasks(t);
    setAgents(a);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await base44.entities.Project.create(form);
    toast.success("Project created!");
    setForm({ name: "", description: "", objective: "", priority: "medium", status: "backlog" });
    setShowAdd(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Projects & Tasks"
        subtitle="Manage your company's initiatives and track progress"
        action={
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        }
      />

      <ProjectBoard projects={projects} tasks={tasks} agents={agents} onRefresh={loadData} />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Project Name</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this project about?" rows={3} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Objective</label>
              <Input value={form.objective} onChange={(e) => setForm(p => ({ ...p, objective: e.target.value }))} placeholder="What should this achieve?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}