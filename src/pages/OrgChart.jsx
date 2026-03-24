import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader";
import AgentAvatar from "../components/shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS } from "../lib/agentsData";

function AgentCard({ agent }) {
  return (
    <Link
      to={`/agent/${agent.id}`}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 w-44 flex flex-col items-center text-center group"
    >
      <AgentAvatar agent={agent} size="lg" showStatus />
      <p className="text-sm font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">
        {agent.title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{agent.title_he}</p>
      <div
        className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{
          backgroundColor: `${agent.color}20`,
          color: agent.color
        }}
      >
        {agent.department}
      </div>
    </Link>
  );
}

export default function OrgChart() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Agent.list().then(a => {
      setAgents(a);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const cSuite = agents.filter(a => a.level === "c_suite" && a.is_active);
  const vps = agents.filter(a => a.level === "vp" && a.is_active);
  const specials = agents.filter(a => a.level === "special" && a.is_active);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Organization Chart" subtitle="Your AI executive team structure" />

      {/* Special Roles */}
      {specials.length > 0 && (
        <Section title={LEVEL_LABELS.special.en} subtitle={LEVEL_LABELS.special.he}>
          <div className="flex flex-wrap gap-4 justify-center">
            {specials.map(a => <AgentCard key={a.id} agent={a} />)}
          </div>
        </Section>
      )}

      {/* C-Suite */}
      {cSuite.length > 0 && (
        <Section title={LEVEL_LABELS.c_suite.en} subtitle={LEVEL_LABELS.c_suite.he}>
          <div className="flex flex-wrap gap-4 justify-center">
            {cSuite.map(a => <AgentCard key={a.id} agent={a} />)}
          </div>
        </Section>
      )}

      {/* VP Level */}
      {vps.length > 0 && (
        <Section title={LEVEL_LABELS.vp.en} subtitle={LEVEL_LABELS.vp.he}>
          <div className="flex flex-wrap gap-4 justify-center">
            {vps.map(a => <AgentCard key={a.id} agent={a} />)}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </div>
  );
}