import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Onboarding from "../pages/Onboarding";

export default function AppShell({ children }) {
  const [isSetup, setIsSetup] = useState(null); // null = loading, true = done, false = needs setup

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    const cores = await base44.entities.CompanyCore.list("-created_date", 1);
    if (cores.length > 0 && cores[0].is_setup_complete) {
      setIsSetup(true);
    } else {
      setIsSetup(false);
    }
  };

  if (isSetup === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">MC</span>
          </div>
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isSetup) {
    return <Onboarding onComplete={() => setIsSetup(true)} />;
  }

  return children;
}