"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo, TFIcon, BrandIcon } from "@/components/icons";
import {
  onboardingCreateProject,
  onboardingInvite,
  onboardingIntegrations,
  completeOnboarding,
} from "@/app/actions/onboarding";

const inputCls =
  "w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring";

const TEMPLATES = [
  { id: "blank", icon: "tpl-blank", label: "Blank", desc: "Start from scratch" },
  { id: "web", icon: "tpl-web", label: "Web App", desc: "Auth, navigation, form suites" },
  { id: "mobile", icon: "tpl-mobile", label: "Mobile App", desc: "Onboarding, push, offline suites" },
  { id: "api", icon: "tpl-api", label: "API Service", desc: "Auth, CRUD, error handling suites" },
];

const INTEGRATIONS = [
  { id: "jira", label: "Jira" },
  { id: "github", label: "GitHub" },
  { id: "cypress", label: "Cypress" },
  { id: "slack", label: "Slack" },
];

export function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Step 1 state
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [template, setTemplate] = useState("blank");
  // Step 2 state
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("MEMBER");
  // Step 3 state
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(
    new Set()
  );

  const next = () => {
    setError(null);
    setInfo(null);
    setStep((s) => s + 1);
  };

  const finish = () =>
    startTransition(async () => {
      await completeOnboarding();
      router.push("/dashboard");
    });

  const submitStep1 = () =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", projectName);
      fd.set("description", projectDesc);
      fd.set("template", template);
      const res = await onboardingCreateProject(fd);
      if (res?.error) setError(res.error);
      else next();
    });

  const submitStep2 = () =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set("emails", emails);
      fd.set("role", role);
      const res = await onboardingInvite(fd);
      if (res?.error) setError(res.error);
      else {
        setInfo(`${res.invited} invitations recorded.`);
        next();
      }
    });

  const submitStep3 = () =>
    startTransition(async () => {
      const fd = new FormData();
      selectedIntegrations.forEach((i) => fd.append("integrations", i));
      await onboardingIntegrations(fd);
      next();
    });

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          {step <= 3 && (
            <>
              <p className="mt-2 text-sm text-content-muted">
                Hi {userName}! Set up your workspace — every step can be
                skipped.
              </p>
              <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full motion-safe:transition-colors motion-safe:duration-panel motion-safe:ease-tf-out ${i <= step ? "bg-accent" : "bg-surface-muted"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-content-subtle">Step {step} / 3</p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-8 shadow-sm">
          {error && (
            <p className="mb-4 rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4 motion-safe:animate-tf-pop-in">
              <h1 className="text-lg font-bold">Create Your First Project</h1>
              <div>
                <label className="mb-1 block text-sm font-medium text-content">
                  Project Name
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Web Portal"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-content">
                  Description (optional)
                </label>
                <input
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-content">
                  Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`rounded-lg border p-3 text-left text-sm ${
                        template === t.id
                          ? "border-accent bg-accent-soft ring-1 ring-accent-ring"
                          : "border-hairline hover:border-hairline-strong"
                      }`}
                    >
                      <span className="mb-1 block"><TFIcon name={t.icon} className="h-6 w-6" /></span>
                      <span className="font-medium">{t.label}</span>
                      <p className="mt-0.5 text-xs text-content-muted">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={next} className="text-sm text-content-subtle hover:text-content">
                  Skip →
                </button>
                <button
                  onClick={submitStep1}
                  disabled={pending || !projectName.trim()}
                  className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {pending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 motion-safe:animate-tf-pop-in">
              <h1 className="text-lg font-bold">Invite Team Members</h1>
              <p className="text-sm text-content-muted">
                Working solo? Just skip — you can invite anytime later.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-content">
                  Member emails (separate by comma or new line)
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  rows={3}
                  placeholder={"qa1@perusahaan.com\nqa2@perusahaan.com"}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-content">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={next} className="text-sm text-content-subtle hover:text-content">
                  Skip →
                </button>
                <button
                  onClick={submitStep2}
                  disabled={pending || !emails.trim()}
                  className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {pending ? "Saving..." : "Send Invitations"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 motion-safe:animate-tf-pop-in">
              <h1 className="text-lg font-bold">Choose Integrations</h1>
              <p className="text-sm text-content-muted">
                Mark the ones you want to use — detailed setup can be done later.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {INTEGRATIONS.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() =>
                      setSelectedIntegrations((prev) => {
                        const n = new Set(prev);
                        if (n.has(it.id)) n.delete(it.id);
                        else n.add(it.id);
                        return n;
                      })
                    }
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                      selectedIntegrations.has(it.id)
                        ? "border-accent bg-accent-soft ring-1 ring-accent-ring"
                        : "border-hairline hover:border-hairline-strong"
                    }`}
                  >
                    <BrandIcon name={it.id} className="h-6 w-6" />
                    {it.label}
                    {selectedIntegrations.has(it.id) && (
                      <span className="ml-auto text-accent-text">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={next} className="text-sm text-content-subtle hover:text-content">
                  Skip →
                </button>
                <button
                  onClick={submitStep3}
                  disabled={pending}
                  className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {pending ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center motion-safe:animate-tf-pop-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
                <TFIcon name="celebrate" current className="h-8 w-8" />
              </div>
              <h1 className="text-lg font-bold">Start Exploring</h1>
              {info && <p className="text-sm text-success">{info}</p>}
              <ul className="mx-auto max-w-sm space-y-2 text-left text-sm text-content">
                <li className="flex items-center gap-2 rounded-lg border border-hairline-subtle p-3">
                  <TFIcon name="checklist" className="h-5 w-5 shrink-0" /> Create your first test case in the <b>Test Cases</b> tab
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-hairline-subtle p-3">
                  <TFIcon name="checklist" className="h-5 w-5 shrink-0" /> Create a test run and execute with the <b>P/F/B</b> shortcuts
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-hairline-subtle p-3">
                  <TFIcon name="checklist" className="h-5 w-5 shrink-0" /> Upload automation results via <b>API Keys + JUnit XML</b>
                </li>
              </ul>
              <button
                onClick={finish}
                disabled={pending}
                className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {pending ? "Opening dashboard..." : "Go to Dashboard →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
