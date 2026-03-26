import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Settings, Users, Loader2, ToggleLeft, ToggleRight, Plug } from "lucide-react";
import ConnectorsPanel from "../components/settings/ConnectorsPanel";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import PageHeader from "../components/shared/PageHeader";
import AgentAvatar from "../components/shared/AgentAvatar";
import { toast } from "sonner";

export default function SettingsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Agent.list().then(a => {
      setAgents(a);
      setLoading(false);
    });
  }, []);

  const toggleAgent = async (agent) => {
    await base44.entities.Agent.update(agent.id, { is_active: !agent.is_active });
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, is_active: !a.is_active } : a));
    toast.success(`${agent.title} ${agent.is_active ? "disabled" : "enabled"}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Settings" subtitle="Configure your company and agents" />

      {/* Integrations */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" /> חיבורים חיצוניים
        </h3>
        <p className="text-xs text-muted-foreground mb-4">חבר את הכלים החיצוניים שלך כדי שהסוכנים יוכלו לפעול בשמך</p>
        <ConnectorsPanel />
      </div>

      {/* Agent Management */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Agent Management
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Enable or disable agents in your organization</p>
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
              <AgentAvatar agent={agent} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{agent.title}</p>
                <p className="text-xs text-muted-foreground">{agent.title_he} · {agent.department}</p>
              </div>
              <button onClick={() => toggleAgent(agent)} className="text-muted-foreground hover:text-foreground transition-colors">
                {agent.is_active ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}