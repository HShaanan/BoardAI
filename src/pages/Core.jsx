import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Loader2, Plus, Trash2, Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

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
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");

  const selectedCompany = companies.find(c => c.id === selectedId);

  const loadCompanies = async () => {
    const items = await base44.entities.CompanyCore.list("-created_date", 50);
    setCompanies(items);
    if (items.length > 0 && !selectedId) {
      setSelectedId(items[0].id);
      setForm(items[0]);
    }
    setLoading(false);
  };

  useEffect(() => { loadCompanies(); }, []);

  const handleSelectCompany = (id) => {
    const company = companies.find(c => c.id === id);
    setSelectedId(id);
    setForm(company || {});
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, is_setup_complete: true };
    if (selectedCompany) {
      await base44.entities.CompanyCore.update(selectedCompany.id, data);
      setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, ...data } : c));
    }
    toast.success("החברה נשמרה בהצלחה!");
    setSaving(false);
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    const created = await base44.entities.CompanyCore.create({ company_name: newName, is_setup_complete: false });
    setCompanies(prev => [created, ...prev]);
    setSelectedId(created.id);
    setForm(created);
    setShowNewDialog(false);
    setNewName("");
    toast.success("חברה חדשה נוצרה!");
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    if (!confirm(`למחוק את "${selectedCompany.company_name}"?`)) return;
    await base44.entities.CompanyCore.delete(selectedCompany.id);
    const remaining = companies.filter(c => c.id !== selectedCompany.id);
    setCompanies(remaining);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
      setForm(remaining[0]);
    } else {
      setSelectedId(null);
      setForm({});
    }
    toast.success("החברה נמחקה");
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
        subtitle="ה-DNA של החברה — כל סוכן קורא זאת לפני שהוא מגיב"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> חברה חדשה
            </Button>
            {selectedCompany && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                שמור
              </Button>
            )}
          </div>
        }
      />

      {/* Company Selector */}
      {companies.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
          <Select value={selectedId || ""} onValueChange={handleSelectCompany}>
            <SelectTrigger className="flex-1 bg-card">
              <SelectValue placeholder="בחר חברה..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company_name || "ללא שם"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompany && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {companies.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold text-lg">אין חברות עדיין</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">צור את החברה הראשונה שלך</p>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" /> צור חברה
          </Button>
        </div>
      ) : selectedCompany ? (
        <div className="space-y-6">
          {/* Stage & Language */}
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

          {/* Core Fields */}
          {FIELDS.map(field => (
            <div key={field.key} className="bg-card rounded-xl border border-border p-5">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">{field.label}</label>
              {field.type === "input" ? (
                <Input
                  value={form[field.key] || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="bg-background"
                />
              ) : (
                <Textarea
                  value={form[field.key] || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={4}
                  className="bg-background"
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* New Company Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>חברה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">שם החברה</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="הכנס שם חברה..."
                className="bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
                autoFocus
              />
            </div>
            <Button onClick={handleCreateNew} className="w-full" disabled={!newName.trim()}>
              <Plus className="w-4 h-4 mr-2" /> צור חברה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}