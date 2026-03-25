import { Sparkles, Plus, Clock, ChevronLeft, MessageSquare, Square, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MeetingSidebar({ meetings, currentId, onSelect, onNewMeeting, onEndMeeting, phase, isOpen, onToggle }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onToggle} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 md:z-auto
        flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-200 shrink-0
        ${isOpen ? "w-64" : "w-0 md:w-14 overflow-hidden"}
      `}>

        {/* Toggle button */}
        <div className={`flex items-center border-b border-sidebar-border px-2 py-3 ${isOpen ? "justify-between" : "justify-center"}`}>
          {isOpen && (
            <span className="text-xs font-semibold text-sidebar-foreground px-2">Board Room</span>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            title={isOpen ? "סגור" : "פתח"}
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* New meeting */}
        <div className={`p-2 border-b border-sidebar-border ${!isOpen ? "flex justify-center" : ""}`}>
          {isOpen ? (
            <Button
              onClick={onNewMeeting}
              size="sm"
              variant="ghost"
              className="w-full justify-start gap-2 text-xs h-9 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="w-4 h-4 shrink-0" />
              ישיבה חדשה
            </Button>
          ) : (
            <button
              onClick={onNewMeeting}
              title="ישיבה חדשה"
              className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Active meeting indicator */}
        {phase === "running" && isOpen && (
          <div className="p-2 border-b border-sidebar-border">
            <div className="bg-success/10 border border-success/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                <span className="text-[11px] font-medium text-success">ישיבה פעילה</span>
              </div>
              <button
                onClick={onEndMeeting}
                className="flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-1.5 py-1 rounded-lg transition-colors shrink-0"
              >
                <Square className="w-2.5 h-2.5" /> סיים
              </button>
            </div>
          </div>
        )}
        {phase === "running" && !isOpen && (
          <div className="flex justify-center py-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" title="ישיבה פעילה" />
          </div>
        )}

        {/* Meetings list */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto py-1">
            {meetings.length === 0 ? (
              <div className="text-center py-10 px-3">
                <MessageSquare className="w-7 h-7 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-[11px] text-muted-foreground">אין ישיבות קודמות</p>
              </div>
            ) : (
              <div className="px-2 space-y-0.5">
                {meetings.map(m => (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m)}
                    className={`w-full text-right px-3 py-2.5 rounded-xl transition-all hover:bg-sidebar-accent group ${
                      currentId === m.id ? "bg-sidebar-accent" : ""
                    }`}
                  >
                    <p className={`text-xs font-medium line-clamp-1 leading-snug ${currentId === m.id ? "text-foreground" : "text-sidebar-foreground"}`}>
                      {m.topic && m.topic !== "board_room_discussion"
                        ? m.topic
                        : `ישיבת דירקטוריון`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(m.created_date).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}