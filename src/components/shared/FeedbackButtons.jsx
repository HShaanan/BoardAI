import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function FeedbackButtons({ message, agentRoleKey, agentTitle }) {
  const [rating, setRating] = useState(null); // "positive" | "negative"
  const [saved, setSaved] = useState(false);

  const handleFeedback = async (value) => {
    if (saved) return;
    setRating(value);
    setSaved(true);

    const snippet = message.content?.slice(0, 120) || "";
    const title =
      value === "positive"
        ? `✅ תשובה טובה — ${agentTitle || agentRoleKey}`
        : `⚠️ תשובה לשיפור — ${agentTitle || agentRoleKey}`;

    await base44.entities.BrainEntry.create({
      title,
      content: `סוכן: ${agentTitle || agentRoleKey}\nדירוג: ${value === "positive" ? "חיובי 👍" : "שלילי 👎"}\n\nתוכן:\n${message.content || ""}`,
      source_type: "feedback",
      feedback_rating: value,
      agent_role_key: agentRoleKey || null,
      category: "agent_feedback",
      tags: ["feedback", agentRoleKey || "unknown", value],
    });
  };

  if (saved) {
    return (
      <div className="flex items-center gap-1 mt-2">
        <Check className="w-3 h-3 text-green-500" />
        <span className="text-[10px] text-muted-foreground">נשמר במוח הארגוני</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleFeedback("positive")}
        className={cn(
          "p-1 rounded-md transition-colors hover:bg-green-500/20",
          rating === "positive" ? "text-green-500" : "text-muted-foreground/50 hover:text-green-500"
        )}
        title="תשובה טובה"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleFeedback("negative")}
        className={cn(
          "p-1 rounded-md transition-colors hover:bg-red-500/20",
          rating === "negative" ? "text-red-500" : "text-muted-foreground/50 hover:text-red-500"
        )}
        title="תשובה לשיפור"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}