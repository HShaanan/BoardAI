import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentAvatar from "../components/shared/AgentAvatar";
import ChatAgentList from "../components/chat/ChatAgentList";
import ChatMessageBubble from "../components/chat/ChatMessageBubble";

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
        if (found) handleSelectAgent(found, a);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectAgent = async (agent) => {
    setSelectedAgent(agent);
    // Find or create conversation
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
    setInput("");

    // Build prompt for the agent
    const coreContext = core ? `
COMPANY CORE:
Company: ${core.company_name || "Not set"}
Mission: ${core.mission || "Not set"}
Vision: ${core.vision || "Not set"}
Target Audience: ${core.target_audience || "Not set"}
Tone: ${core.tone_of_voice || "Not set"}
Guidelines: ${core.brand_guidelines || "Not set"}
Goals: ${core.business_goals || "Not set"}
Rules: ${core.constitution_rules || "Not set"}
` : "";

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

${coreContext}

RECENT CONVERSATION:
${recentContext}

RULES:
1. Always align with the Company Core
2. Stay in character with your personality and communication style
3. Address the user as "the Board" or respectfully as a board member
4. If unsure, recommend the Board decide
5. Flag risks or concerns proactively
6. Be helpful, professional, and provide actionable insights
7. Respond in the same language the Board uses`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nBoard directive: ${input.trim()}`,
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

  return (
    <div className="flex h-screen">
      {/* Agent List */}
      <ChatAgentList
        agents={agents}
        selectedAgent={selectedAgent}
        onSelect={handleSelectAgent}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedAgent ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Select an Agent</p>
              <p className="text-sm text-muted-foreground mt-1">Choose who you'd like to speak with</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center gap-3 px-6 bg-card/50">
              <AgentAvatar agent={selectedAgent} size="sm" showStatus />
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedAgent.title}</p>
                <p className="text-xs text-muted-foreground">{selectedAgent.title_he}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <AgentAvatar agent={selectedAgent} size="xl" />
                  <p className="text-foreground font-semibold mt-4">{selectedAgent.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAgent.responsibilities}</p>
                  <p className="text-xs text-muted-foreground mt-4">Start a conversation with your {selectedAgent.title}...</p>
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
            <div className="p-4 border-t border-border bg-card/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Issue a board directive..."
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !input.trim()} className="gap-2">
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