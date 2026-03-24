import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

const FIELDS = [
  { key: "company_name", label: "Company Name", type: "input", placeholder: "Your company name" },
  { key: "industry", label: "Industry", type: "input", placeholder: "e.g., SaaS, E-commerce, Education" },
  { key: "mission", label: "Mission Statement", type: "textarea", placeholder: "Why does this company exist?" },
  { key: "vision", label: "Vision", type: "textarea", placeholder: "Where is this company heading?" },
  { key: "target_audience", label: "Target Audience", type: "textarea", placeholder: "Who are you serving? Demographics, psychographics, pain points..." },
  { key: "tone_of_voice", label: "Tone of Voice", type: "textarea", placeholder: "How should your brand communicate? Formal/casual, playful/serious..." },
  { key: "brand_guidelines", label: "Brand Guidelines", type: "textarea", placeholder: "Colors, values, do's and don'ts..." },
  { key: "business_goals", label: "Business Goals", type: "textarea", placeholder: "Quarterly and annual targets..." },
  { key: "constitution_rules", label: "Company Constitution", type: "textarea", placeholder: "Rules every agent must follow..." },
];

export default function Core() {
  const [core, setCore] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.CompanyCore.list("-created_date", 1).then(items => {
      if (items.length > 0) {
        setCore(items[0]);
        setForm(items[0]);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, is_setup_complete: true };
    if (core) {
      await base44.entities.CompanyCore.update(core.id, data);
    } else {
      const created = await base44.entities.CompanyCore.create(data);
      setCore(created);
    }
    toast.success("Company Core saved successfully!");
    setSaving(false);
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
        title="Company Core"
        subtitle="The DNA of your company — every agent reads this before responding"
        action={
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Core
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Stage & Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Company Stage</label>
            <Select value={form.company_stage || ""} onValueChange={(v) => setForm(prev => ({ ...prev, company_stage: v }))}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                <SelectItem value="seed">Seed</SelectItem>
                <SelectItem value="series_a">Series A</SelectItem>
                <SelectItem value="series_b">Series B</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="mature">Mature</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Language</label>
            <Select value={form.language_preference || "en"} onValueChange={(v) => setForm(prev => ({ ...prev, language_preference: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="he">עברית (Hebrew)</SelectItem>
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
    </div>
  );
}