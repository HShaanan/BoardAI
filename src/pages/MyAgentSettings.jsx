import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Loader2, ChevronDown, ChevronRight, Brain, SlidersHorizontal, Trash2 } from "lucide-react";
import AgentAvatar from "../components/shared/AgentAvatar";
import PageHeader from "../components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MEMORY_TYPE_LABELS = {
  decision: "החלטה",
  lesson: "לקח",
  preference: "העדפה",
  feedback: "פידבק",
};

export default function MyAgentSettings() {
  const [agents, setAgents] = useState([]);
  const [configs, setConfigs] = useState({}); // role_key → UserAgentConfig record
  const [memories, setMemories] = useState([]); // MemoryEntry records for current user
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [expanded, setExpanded] = useState({});
  const [drafts, setDrafts] = useState({}); // role_key → draft text

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [user, agentList, configList, memList] = await Promise.all([
      base44.auth.me(),
      base44.entities.Agent.list(),
      base44.entities.UserAgentConfig.list(),
      base44.entities.MemoryEntry.list(),
    ]);
    setMe(user);
    setAgents(agentList.filter(a => a.is_active));

    // Map configs by role_key (only current user's, enforced by RLS via created_by)
    const cfgMap = {};
    configList.forEach(c => { cfgMap[c.agent_role_key] = c; });
    setConfigs(cfgMap);

    // Drafts initialized from saved configs
    const draftMap = {};
    configList.forEach(c => { draftMap[c.agent_role_key] = c.custom_instructions || ""; });
    setDrafts(draftMap);

    setMemories(memList);
    setLoading(false);
  };

  const handleSave = async (agent) => {
    const rk = agent.role_key;
    setSaving(prev => ({ ...prev, [rk]: true }));
    const existing = configs[rk];
    const text = drafts[rk] || "";

    if (existing) {
      await base44.entities.UserAgentConfig.update(existing.id, { custom_instructions: text });
    } else {
      const created = await base44.entities.UserAgentConfig.create({
        agent_role_key: rk,
        agent_title: agent.title,
        custom_instructions: text,
      });
      setConfigs(prev => ({ ...prev, [rk]: created }));
    }
    toast.success(`ההגדרות האישיות ל-${agent.title_he || agent.title} נשמרו`);
    setSaving(prev => ({ ...prev, [rk]: false }));
  };

  const handleDeleteMemory = async (memId) => {
    await base44.entities.MemoryEntry.delete(memId);
    setMemories(prev => prev.filter(m => m.id !== memId));
  };

  const toggleAgent = (rk) => setExpanded(prev => ({ ...prev, [rk]: !prev[rk] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="ההגדרות האישיות שלי"
        subtitle="הגדר הוראות אישיות לכל סוכן — הן יתווספו לשיחות שלך בלבד"
      />

      <div className="space-y-3">
        {agents.map(agent => {
          const rk = agent.role_key;
          const isOpen = expanded[rk];
          const agentMemories = memories.filter(m => m.agent_id === agent.id);
          const draft = drafts[rk] ?? configs[rk]?.custom_instructions ?? "";
          const isDirty = draft !== (configs[rk]?.custom_instructions || "");

          return (
            <div key={rk} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggleAgent(rk)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors text-right"
              >
                <AgentAvatar agent={agent} size="sm" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-semibold text-foreground">{agent.title_he || agent.title}</p>
                  <p className="text-xs text-muted-foreground">{agent.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {configs[rk]?.custom_instructions && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">מותאם אישית</span>
                  )}
                  {agentMemories.length > 0 && (
                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">{agentMemories.length} זיכרונות</span>
                  )}
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border p-4 space-y-5">
                  {/* Personal instructions */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-semibold text-foreground">הוראות אישיות (Master Prompt)</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      הוראות אלה יתווספו לתחילת כל שיחה שלך עם סוכן זה. אין לאחרים גישה אליהן.
                    </p>
                    <Textarea
                      value={draft}
                      onChange={e => setDrafts(prev => ({ ...prev, [rk]: e.target.value }))}
                      placeholder={`לדוגמה: תמיד ענה בעברית. התמקד בנושאי מוצר בלבד. הכר אותי - אני ה-CTO של החברה...`}
                      rows={4}
                      className="bg-background/60 text-sm resize-none"
                      dir="auto"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(agent)}
                        disabled={saving[rk] || !isDirty}
                        className="gap-1.5 text-xs"
                      >
                        {saving[rk] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        שמור
                      </Button>
                    </div>
                  </div>

                  {/* Memories */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-3.5 h-3.5 text-accent" />
                      <p className="text-xs font-semibold text-foreground">זיכרונות שנשמרו ({agentMemories.length})</p>
                    </div>
                    {agentMemories.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        אין זיכרונות עדיין — הסוכן ישמור זיכרונות בזמן שיחות
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {agentMemories.map(m => (
                          <div key={m.id} className="flex items-start gap-3 bg-background/50 rounded-lg px-3 py-2.5 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] bg-accent/20 text-accent rounded px-1.5 py-0.5">
                                  {MEMORY_TYPE_LABELS[m.memory_type] || m.memory_type}
                                </span>
                                {m.created_date && (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    {new Date(m.created_date).toLocaleDateString("he-IL")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-foreground/85 leading-relaxed">{m.content}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteMemory(m.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}