import { Sparkles, Plus, Clock, ChevronLeft, MessageSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHASE_LABELS = {
  idle: "ממתין",
  planning: "בתכנון",
  confirming: "אישור",
  running: "פעיל",
  done: "הסתיים",
};

const PHASE_COLORS = {
  idle: "text-muted-foreground",
  planning: "text-warning",
  confirming: "text-primary",
  running: "text-success animate-pulse",
  done: "text-muted-foreground",
};

export default function MeetingSidebar({ meetings, currentId, onSelect, onNewMeeting, onEndMeeting, phase, isOpen, onToggle }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={onToggle} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 md:z-auto
        flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-300 shrink-0
        ${isOpen ? "w-64" : "w-0 md:w-12 overflow-hidden"}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border min-w-[12rem] md:min-w-0">
          {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs font-semibold text-sidebar-foreground truncate">היסטוריית ישיבות</span>
            </div>
          )}
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors ml-auto">
            <ChevronLeft className={`w-4 h-4 text-sidebar-foreground transition-transform ${!isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && (
          <div className="flex flex-col flex-1 overflow-hidden min-w-[12rem]">
            {/* New meeting button */}
            <div className="p-2 border-b border-sidebar-border">
              <Button
                onClick={onNewMeeting}
                size="sm"
                className="w-full rounded-xl gap-2 text-xs h-8"
                variant="outline"
              >
                <Plus className="w-3.5 h-3.5" /> ישיבה חדשה
              </Button>
            </div>

            {/* Active meeting status */}
            {phase === "running" && (
              <div className="p-2 border-b border-sidebar-border">
                <div className="bg-success/10 border border-success/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] font-medium text-success">ישיבה פעילה</span>
                  </div>
                  <button
                    onClick={onEndMeeting}
                    className="flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-1.5 py-1 rounded-lg transition-colors"
                  >
                    <Square className="w-2.5 h-2.5" /> סיים
                  </button>
                </div>
              </div>
            )}

            {/* Meetings list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-[11px] text-muted-foreground">אין ישיבות קודמות</p>
                </div>
              ) : (
                meetings.map(m => (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m)}
                    className={`w-full text-right p-2.5 rounded-xl transition-all hover:bg-sidebar-accent ${
                      currentId === m.id ? "bg-sidebar-accent border border-sidebar-border" : ""
                    }`}
                  >
                    <p className="text-[11px] font-medium text-sidebar-foreground line-clamp-2 leading-snug">
                      {m.topic && m.topic !== "board_room_discussion"
                        ? m.topic
                        : `ישיבה ${new Date(m.created_date).toLocaleDateString("he-IL")}`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(m.created_date).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer stats */}
            <div className="p-3 border-t border-sidebar-border">
              <p className="text-[10px] text-muted-foreground text-center">{meetings.length} ישיבות סה"כ</p>
            </div>
          </div>
        )}

        {/* Collapsed icons */}
        {!isOpen && (
          <div className="flex flex-col items-center gap-2 p-2 mt-2 min-w-[3rem]">
            <button onClick={onNewMeeting} className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors" title="ישיבה חדשה">
              <Plus className="w-4 h-4 text-sidebar-foreground" />
            </button>
            {phase === "running" && (
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" title="ישיבה פעילה" />
            )}
          </div>
        )}
      </div>
    </>
  );
}