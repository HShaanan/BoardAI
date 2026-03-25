import { useState } from "react";
import { Zap, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function QuickDirective({ onDirectiveCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);

    const directive = await base44.entities.Directive.create({
      content: content.trim(),
      priority: "medium",
      status: "issued"
    });

    // Trigger Chief of Staff via real agent SDK
    const convo = await base44.agents.createConversation({
      agent_name: "chief_of_staff",
      metadata: { title: `Directive: ${content.trim().slice(0, 60)}` }
    });
    base44.agents.addMessage(convo, {
      role: "user",
      content: `Directive ID: ${directive.id}\n\nBoard Directive: "${content.trim()}"\n\nPriority: medium\n\nAnalyze this directive, break it into tasks, assign to relevant agents, and provide a summary.`
    }).then(async () => {
      // Poll and update directive with response
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const updated = await base44.agents.getConversation(convo.id);
        const assistantMsgs = (updated.messages || []).filter(m => m.role === "assistant");
        if (assistantMsgs.length > 0 || attempts > 20) {
          clearInterval(poll);
          const response = assistantMsgs[assistantMsgs.length - 1]?.content;
          if (response) {
            await base44.entities.Directive.update(directive.id, { status: "parsed", ai_response: response });
          }
          onDirectiveCreated?.();
        }
      }, 1500);
    });

    setContent("");
    setLoading(false);
    onDirectiveCreated?.();
  };

  return (
    <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl border border-accent/30 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Board Directive</h3>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Issue a directive to your executive team..."
          className="flex-1 bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}