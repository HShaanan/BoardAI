import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Plus, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const SELECTED_COMPANY_KEY = "selected_company_id";

export function getSelectedCompanyId() {
  return localStorage.getItem(SELECTED_COMPANY_KEY);
}

export default function CompanySwitcher({ collapsed }) {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.CompanyCore.list("-created_date", 50).then((items) => {
      setCompanies(items);
      const savedId = localStorage.getItem(SELECTED_COMPANY_KEY);
      const found = items.find((c) => c.id === savedId) || items[0];
      if (found) {
        setSelected(found);
        localStorage.setItem(SELECTED_COMPANY_KEY, found.id);
      }
    });
  }, []);

  const handleSelect = (company) => {
    setSelected(company);
    localStorage.setItem(SELECTED_COMPANY_KEY, company.id);
    setOpen(false);
    // Refresh page to reload data for new company
    window.location.reload();
  };

  const handleNewCompany = () => {
    setOpen(false);
    navigate("/core?new=1");
  };

  if (!selected) return null;

  return (
    <div className="relative px-2 py-2 border-b border-sidebar-border">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-all",
          collapsed && "justify-center"
        )}
      >
        <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-semibold text-foreground truncate text-right">
              {selected.company_name || "חברה"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-2 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-1">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-all text-right"
                >
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="flex-1 text-sm text-foreground truncate">{c.company_name || "ללא שם"}</span>
                  {selected.id === c.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
            <div className="border-t border-border p-1">
              <button
                onClick={handleNewCompany}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-all text-primary"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">חברה חדשה</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}