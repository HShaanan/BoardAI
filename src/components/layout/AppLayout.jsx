import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>
      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}