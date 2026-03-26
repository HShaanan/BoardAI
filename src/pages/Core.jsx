import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";
import { getSelectedCompanyId, SELECTED_COMPANY_KEY } from "../components/layout/CompanySwitcher";

const FIELDS = [
  { key: "company_name", label: "שם החברה", type: "input", placeholder: "שם החברה שלך" },
  { key: "industry", label: "תעשייה", type: "input", placeholder: "למשל: SaaS, E-commerce, חינוך" },
  { key: "mission", label: "משימה", type: "textarea", placeholder: "למה החברה הזו קיימת?" },
  { key: "vision", label: "חזון", type: "textarea", placeholder: "לאן החברה הזו פונה?" },
  { key: "target_audience", label: "קהל יעד", type: "textarea", placeholder: "למי אתם משרתים?" },
  { key: "tone_of_voice", label: "סגנון תקשורת", type: "textarea", placeholder: "איך המותג מתקשר?" },
  { key: "brand_guidelines", label: "מדריך מיתוג", type: "textarea", placeholder: "צבעים, ערכים, כללים..." },
  { key: "business_goals", label: "יעדים עסקיים", type: "textarea", placeholder: "יעדים רבעוניים ושנתיים..." },
  { key: "constitution_rules", label: "חוקת החברה", type: "textarea", placeholder: "כללים שכל סוכן חייב לעמוד בהם..." },
];

export default function Core() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user arrived via "new company" link
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setShowNewDialog(true);
      setLoading(false);
      return;
    }

    const selectedId = getSelectedCompanyId();
    if (selectedId) {
      base44.entities.CompanyCore.list("-created_date", 50).then((items) => {
        const found = items.find((c) => c.id === selectedId) || items[0];
        if (found) {
          setCompany(found);
          setForm(found);
        }
        setLoading(false);
      });
    } else {
      base44.entities.CompanyCore.list("-created_date", 1).then((items) => {
        if (items[0]) { setCompany(items[0]); setForm(items[0]); }
        setLoading(false);
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, is_setup_complete: true };
    if (company) {
      await base44.entities.CompanyCore.update(company.id, data);
      setCompany({ ...company, ...data });
    }
    toast.success("החברה נשמרה בהצלחה!");
    setSaving(false);
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    const created = await base44.entities.CompanyCore.create({ company_name: newName, is_setup_complete: false });
    localStorage.setItem(SELECTED_COMPANY_KEY, created.id);
    toast.success("חברה חדשה נוצרה!");
    // Reload to update CompanySwitcher
    window.location.href = "/core";
  };

  const handleDelete = async () => {
    if (!company) return;
    if (!confirm(`למחוק את "${company.company_name}"?`)) return;
    await base44.entities.CompanyCore.delete(company.id);
    localStorage.removeItem(SELECTED_COMPANY_KEY);
    toast.success("החברה נמחקה");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="ליבת החברה"
        subtitle={company?.company_name || "הגדרות החברה הנוכחית"}
        action={
          <div className="flex gap-2">
            {company && (
              <>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  שמור
                </Button>
              </>
            )}
          </div>
        }
      />

      {company ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">שלב החברה</label>
              <Select value={form.company_stage || ""} onValueChange={(v) => setForm(prev => ({ ...prev, company_stage: v }))}>
                <SelectTrigger><SelectValue placeholder="בחר שלב" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">רעיון</SelectItem>
                  <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series_a">Series A</SelectItem>
                  <SelectItem value="series_b">Series B</SelectItem>
                  <SelectItem value="growth">צמיחה</SelectItem>
                  <SelectItem value="mature">בשל</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">שפה</label>
              <Select value={form.language_preference || "he"} onValueChange={(v) => setForm(prev => ({ ...prev, language_preference: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {FIELDS.map(field => (
            <div key={field.key} className="bg-card rounded-xl border border-border p-5">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">{field.label}</label>
              {field.type === "input" ? (
                <Input value={form[field.key] || ""} onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} className="bg-background" />
              ) : (
                <Textarea value={form[field.key] || ""} onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={4} className="bg-background" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">לא נמצאה חברה. צור חברה חדשה מהתפריט הצדדי.</p>
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={(v) => { setShowNewDialog(v); if (!v) navigate("/core"); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>חברה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">שם החברה</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="הכנס שם חברה..." className="bg-background" onKeyDown={(e) => e.key === "Enter" && handleCreateNew()} autoFocus />
            </div>
            <Button onClick={handleCreateNew} className="w-full" disabled={!newName.trim()}>צור חברה</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}