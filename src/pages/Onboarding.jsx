import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, ArrowLeft, Sparkles, Building2, Target, MessageSquare, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_AGENTS } from "../lib/agentsData";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Building2, title: "Welcome, Chairman", subtitle: "Let's set up your company" },
  { icon: Target, title: "Mission & Vision", subtitle: "What drives your company?" },
  { icon: MessageSquare, title: "Target Audience", subtitle: "Who are you serving?" },
  { icon: BookOpen, title: "Tone & Brand", subtitle: "How should your brand communicate?" },
  { icon: Zap, title: "Business Goals", subtitle: "What do you want to achieve?" },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    company_stage: "seed",
    mission: "",
    vision: "",
    target_audience: "",
    tone_of_voice: "",
    brand_guidelines: "",
    business_goals: "",
    constitution_rules: "",
    language_preference: "en",
  });
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    // Create company core
    await base44.entities.CompanyCore.create({
      ...form,
      is_setup_complete: true,
    });

    // Seed agents only if none exist yet
    const existing = await base44.entities.Agent.list();
    if (existing.length === 0) {
      await base44.entities.Agent.bulkCreate(DEFAULT_AGENTS);
    }

    setLoading(false);
    onComplete();
  };

  const canNext = () => {
    if (step === 0) return form.company_name.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i <= step ? "bg-primary w-12" : "bg-secondary w-8"
              )}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl shadow-black/20">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {step < STEPS.length && (() => {
                const Icon = STEPS[step].icon;
                return <Icon className="w-7 h-7 text-primary" />;
              })()}
            </div>
            <h2 className="text-xl font-bold text-foreground">{STEPS[step]?.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{STEPS[step]?.subtitle}</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Company Name</label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Your company name"
                  className="text-center text-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Industry</label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))}
                  placeholder="e.g., SaaS, E-commerce, Education"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">Stage</label>
                  <Select value={form.company_stage} onValueChange={(v) => setForm(p => ({ ...p, company_stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">Language</label>
                  <Select value={form.language_preference} onValueChange={(v) => setForm(p => ({ ...p, language_preference: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="he">עברית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Mission Statement</label>
                <Textarea
                  value={form.mission}
                  onChange={(e) => setForm(p => ({ ...p, mission: e.target.value }))}
                  placeholder="Why does this company exist? What problem are you solving?"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Vision</label>
                <Textarea
                  value={form.vision}
                  onChange={(e) => setForm(p => ({ ...p, vision: e.target.value }))}
                  placeholder="Where is this company heading? What does the future look like?"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Target Audience</label>
              <Textarea
                value={form.target_audience}
                onChange={(e) => setForm(p => ({ ...p, target_audience: e.target.value }))}
                placeholder="Who are you serving? Describe demographics, psychographics, pain points, and desires..."
                rows={6}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Tone of Voice</label>
                <Textarea
                  value={form.tone_of_voice}
                  onChange={(e) => setForm(p => ({ ...p, tone_of_voice: e.target.value }))}
                  placeholder="Formal or casual? Playful or serious? Technical or simple? Give examples..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Brand Guidelines</label>
                <Textarea
                  value={form.brand_guidelines}
                  onChange={(e) => setForm(p => ({ ...p, brand_guidelines: e.target.value }))}
                  placeholder="Values, do's and don'ts, key messages..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Business Goals</label>
                <Textarea
                  value={form.business_goals}
                  onChange={(e) => setForm(p => ({ ...p, business_goals: e.target.value }))}
                  placeholder="Quarterly and annual targets, revenue goals, growth metrics..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Company Constitution (optional)</label>
                <Textarea
                  value={form.constitution_rules}
                  onChange={(e) => setForm(p => ({ ...p, constitution_rules: e.target.value }))}
                  placeholder="Rules every agent must follow..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                {loading ? (
                  <><Sparkles className="w-4 h-4 animate-spin" /> Setting up...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Launch My Company</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}