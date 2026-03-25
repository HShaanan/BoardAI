import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, ArrowLeft, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentAvatar from "../components/shared/AgentAvatar";
import ChatAgentList from "../components/chat/ChatAgentList";
import ChatMessageBubble from "../components/chat/ChatMessageBubble";
import { exportConversationToKnowledge } from "../lib/exportToKnowledge";

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedAgentId = urlParams.get("agent");

  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [core, setCore] = useState(null);
  const [showAgentList, setShowAgentList] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Agent.list(),
      base44.entities.CompanyCore.list("-created_date", 1),
    ]).then(([a, c]) => {
      setAgents(a.filter(ag => ag.is_active));
      if (c.length > 0) setCore(c[0]);
      if (preselectedAgentId) {
        const found = a.find(ag => ag.id === preselectedAgentId);
        if (found) handleSelectAgent(found);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectAgent = async (agent) => {
    setSelectedAgent(agent);
    const convos = await base44.entities.Conversation.filter({ agent_id: agent.id, type: "individual" });
    let convo;
    if (convos.length > 0) {
      convo = convos[0];
    } else {
      convo = await base44.entities.Conversation.create({
        type: "individual",
        agent_id: agent.id,
        participants: [agent.id],
        topic: `Chat with ${agent.title}`
      });
    }
    setConversation(convo);
    const msgs = await base44.entities.ChatMessage.filter({ conversation_id: convo.id });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedAgent || !conversation) return;
    setSending(true);
    const userMsg = await base44.entities.ChatMessage.create({
      conversation_id: conversation.id,
      role: "board",
      content: input.trim(),
    });
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");

    // Fetch knowledge base entries to inject into agent context
    const brainEntries = await base44.entities.BrainEntry.list("-created_date", 10);
    const knowledgeCtx = brainEntries.length > 0
      ? `\n\nORGANIZATIONAL KNOWLEDGE BASE (past meetings & conversations):\n${brainEntries.map(e => `### ${e.title}\n${e.content?.slice(0, 600)}`).join("\n\n---\n\n")}`
      : "";

    const coreContext = core ? `\nCOMPANY CORE:\nCompany: ${core.company_name || "Not set"}\nMission: ${core.mission || "Not set"}\nVision: ${core.vision || "Not set"}\nTarget Audience: ${core.target_audience || "Not set"}\nTone: ${core.tone_of_voice || "Not set"}\nGuidelines: ${core.brand_guidelines || "Not set"}\nGoals: ${core.business_goals || "Not set"}\nRules: ${core.constitution_rules || "Not set"}\n` : "";

    const recentContext = messages.slice(-6).map(m =>
      `${m.role === "board" ? "Board" : selectedAgent.title}: ${m.content}`
    ).join("\n");

    const systemPrompt = `You are ${selectedAgent.title} (${selectedAgent.title_he}) of the company.

YOUR IDENTITY:
- Role: ${selectedAgent.responsibilities}
- Department: ${selectedAgent.department}
- Personality: ${selectedAgent.personality_traits}
- Communication Style: ${selectedAgent.communication_style}
- Creativity Level: ${selectedAgent.creativity_level}/10
- Verbosity Level: ${selectedAgent.verbosity_level}/10
${coreContext}${knowledgeCtx}

RECENT CONVERSATION:
${recentContext}

RULES:
1. Always align with the Company Core
2. Stay in character with your personality and communication style
3. Address the user as "the Board" or respectfully as a board member
4. If unsure, recommend the Board decide
5. Flag risks or concerns proactively
6. Use the organizational knowledge base above to reference past decisions and meetings
7. Respond in the same language the Board uses`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nBoard directive: ${currentInput}`,
    });

    const agentMsg = await base44.entities.ChatMessage.create({
      conversation_id: conversation.id,
      role: "agent",
      content: response,
      agent_id: selectedAgent.id,
      agent_role_key: selectedAgent.role_key,
    });
    setMessages(prev => [...prev, agentMsg]);
    setSending(false);
  };

  const handleSelectAgentMobile = async (agent) => {
    await handleSelectAgent(agent);
    setShowAgentList(false);
  };

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen overflow-hidden">
      {/* Agent List */}
      <div className={`
        absolute inset-0 z-20 md:static md:z-auto md:block
        transition-transform duration-300
        ${showAgentList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-full md:w-64 bg-sidebar flex flex-col
      `}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <span className="font-semibold text-foreground">Select Agent</span>
        </div>
        <ChatAgentList
          agents={agents}
          selectedAgent={selectedAgent}
          onSelect={handleSelectAgentMobile}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedAgent ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">Select an Agent</p>
              <p className="text-sm text-muted-foreground mt-1">Choose who you'd like to speak with</p>
              <button
                onClick={() => setShowAgentList(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium md:hidden"
              >
                Browse Agents
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/50 shrink-0">
              <button
                onClick={() => setShowAgentList(true)}
                className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <AgentAvatar agent={selectedAgent} size="sm" showStatus />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedAgent.title}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedAgent.title_he}</p>
              </div>
              {messages.length > 2 && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => exportConversationToKnowledge({
                    title: `שיחה עם ${selectedAgent.title}`,
                    messages,
                    type: "agent_chat",
                    agentName: selectedAgent.title
                  })}
                >
                  <Download className="w-3 h-3" /> סיכום
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <AgentAvatar agent={selectedAgent} size="xl" />
                  <p className="text-foreground font-semibold mt-4">{selectedAgent.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedAgent.responsibilities}</p>
                  <p className="text-xs text-muted-foreground mt-4">Start a conversation...</p>
                </div>
              )}
              {messages.map(msg => (
                <ChatMessageBubble key={msg.id} message={msg} agent={selectedAgent} />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{selectedAgent.title} is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card/50 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Issue a board directive..."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="rounded-xl h-auto px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}