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
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

const TEMPLATES = [
  { id: "blank", icon: "tpl-blank", label: "Blank", desc: "Mulai dari kosong" },
  { id: "web", icon: "tpl-web", label: "Web App", desc: "Suite auth, navigasi, form" },
  { id: "mobile", icon: "tpl-mobile", label: "Mobile App", desc: "Suite onboarding, push, offline" },
  { id: "api", icon: "tpl-api", label: "API Service", desc: "Suite auth, CRUD, error handling" },
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
        setInfo(`${res.invited} undangan tercatat.`);
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          {step <= 3 && (
            <>
              <p className="mt-2 text-sm text-slate-500">
                Halo {userName}! Siapkan workspace kamu — semua langkah bisa
                dilewati.
              </p>
              <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">Step {step} / 3</p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold">Buat Project Pertama</h1>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nama Project
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="contoh: Web Portal"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deskripsi (opsional)
                </label>
                <input
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="mb-1 block"><TFIcon name={t.icon} className="h-6 w-6" /></span>
                      <span className="font-medium">{t.label}</span>
                      <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={next} className="text-sm text-slate-400 hover:text-slate-600">
                  Lewati →
                </button>
                <button
                  onClick={submitStep1}
                  disabled={pending || !projectName.trim()}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pending ? "Membuat..." : "Buat Project"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold">Invite Anggota Tim</h1>
              <p className="text-sm text-slate-500">
                Bekerja solo? Lewati saja — bisa invite kapan pun nanti.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email anggota (pisahkan koma atau baris baru)
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
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
                <button onClick={next} className="text-sm text-slate-400 hover:text-slate-600">
                  Lewati →
                </button>
                <button
                  onClick={submitStep2}
                  disabled={pending || !emails.trim()}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pending ? "Menyimpan..." : "Kirim Undangan"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h1 className="text-lg font-bold">Pilih Integrasi</h1>
              <p className="text-sm text-slate-500">
                Tandai yang ingin kamu pakai — setup detail bisa dilakukan nanti.
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
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <BrandIcon name={it.id} className="h-6 w-6" />
                    {it.label}
                    {selectedIntegrations.has(it.id) && (
                      <span className="ml-auto text-indigo-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={next} className="text-sm text-slate-400 hover:text-slate-600">
                  Lewati →
                </button>
                <button
                  onClick={submitStep3}
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pending ? "Menyimpan..." : "Lanjut"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <TFIcon name="celebrate" current className="h-8 w-8" />
              </div>
              <h1 className="text-lg font-bold">Mulai Eksplorasi</h1>
              {info && <p className="text-sm text-green-600">{info}</p>}
              <ul className="mx-auto max-w-sm space-y-2 text-left text-sm text-slate-600">
                <li className="flex items-center gap-2 rounded-lg border border-slate-100 p-3">
                  <TFIcon name="checklist" className="h-5 w-5 shrink-0" /> Buat test case pertama di tab <b>Test Cases</b>
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-slate-100 p-3">
                  <TFIcon name="checklist" className="h-5 w-5 shrink-0" /> Buat test run dan eksekusi dengan shortcut <b>P/F/B</b>
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-slate-100 p-3">
                  <TFIcon name="checklist" className="h-5 w-5 shrink-0" /> Upload hasil automation via <b>API Keys + JUnit XML</b>
                </li>
              </ul>
              <button
                onClick={finish}
                disabled={pending}
                className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {pending ? "Membuka dashboard..." : "Masuk ke Dashboard →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
