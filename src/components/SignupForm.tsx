"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import { dict, type Lang } from "@/lib/i18n";

const inputCls =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-indigo-500";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

// PRD §12.2.2: Weak / Fair / Strong / Very Strong dengan warna
function passwordStrength(pw: string): { key: "weak" | "fair" | "strong" | "veryStrong"; score: number; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { key: "weak", score: 1, color: "bg-red-500" };
  if (score === 2) return { key: "fair", score: 2, color: "bg-orange-400" };
  if (score <= 4) return { key: "strong", score: 3, color: "bg-green-500" };
  return { key: "veryStrong", score: 4, color: "bg-emerald-600" };
}

function SubmitButton({
  disabled,
  label,
  pendingLabel,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function SignupForm({ lang }: { lang: Lang }) {
  const t = dict[lang].auth.signup;
  const [state, formAction] = useFormState(register, undefined);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const effectiveSlug = slugEdited ? orgSlug : slugify(orgName);

  // Validasi per-field (PRD §12.2.1), ditampilkan on-blur
  const errors: Record<string, string | null> = {
    name: name.length >= 2 && name.length <= 100 ? null : t.vName,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? emailAvailable === false
        ? t.vEmailTaken
        : null
      : t.vEmail,
    password:
      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
        ? null
        : t.vPassword,
    confirm: confirm === password ? null : t.vConfirm,
    orgName: orgName.length >= 2 && orgName.length <= 100 ? null : t.vOrgName,
    orgSlug:
      /^[a-z0-9-]+$/.test(effectiveSlug) && effectiveSlug.length >= 2
        ? slugAvailable === false
          ? t.vSlugTaken
          : null
        : t.vSlug,
  };
  const hasErrors = Object.values(errors).some(Boolean) || !agreed;

  // Cek async email & slug, debounce 500ms (PRD §12.2.2)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const r = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`);
        setEmailAvailable((await r.json()).available);
      }
      if (effectiveSlug.length >= 2) {
        const r = await fetch(`/api/auth/check?slug=${encodeURIComponent(effectiveSlug)}`);
        setSlugAvailable((await r.json()).available);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [email, effectiveSlug]);

  const strength = passwordStrength(password);
  const blur = (f: string) => setTouched((prev) => ({ ...prev, [f]: true }));
  const fieldErr = (f: string) =>
    touched[f] && errors[f] ? (
      <p className="mt-1 text-xs text-red-600">{errors[f]}</p>
    ) : null;
  const border = (f: string) =>
    touched[f] && errors[f] ? "border-red-400" : "border-slate-300";

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.fullName} <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => blur("name")}
          placeholder={t.fullNamePh}
          className={`${inputCls} ${border("name")}`}
        />
        {fieldErr("name")}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.email} <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailAvailable(null);
          }}
          onBlur={() => blur("email")}
          placeholder={t.emailPh}
          className={`${inputCls} ${border("email")}`}
        />
        {fieldErr("email")}
        {emailAvailable && touched.email && !errors.email && (
          <p className="mt-1 text-xs text-green-600">{t.emailAvailable}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.password} <span className="text-red-500">*</span>
          </label>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => blur("password")}
            placeholder="••••••••"
            className={`${inputCls} ${border("password")}`}
          />
          {password && (
            <div className="mt-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {t.strength[strength.key]}
              </p>
            </div>
          )}
          {fieldErr("password")}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.confirm} <span className="text-red-500">*</span>
          </label>
          <input
            name="confirmPassword"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => blur("confirm")}
            placeholder="••••••••"
            className={`${inputCls} ${border("confirm")}`}
          />
          {fieldErr("confirm")}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.orgName} <span className="text-red-500">*</span>
        </label>
        <input
          name="orgName"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          onBlur={() => blur("orgName")}
          placeholder={t.orgNamePh}
          className={`${inputCls} ${border("orgName")}`}
        />
        {fieldErr("orgName")}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.workspaceUrl}
        </label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-400">testforge.io/</span>
          <input
            name="orgSlug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setOrgSlug(slugify(e.target.value) || e.target.value.toLowerCase());
              setSlugAvailable(null);
            }}
            onBlur={() => blur("orgSlug")}
            className={`${inputCls} flex-1 ${border("orgSlug")}`}
          />
        </div>
        {fieldErr("orgSlug")}
        {slugAvailable && effectiveSlug && !errors.orgSlug && (
          <p className="mt-1 text-xs text-green-600">
            ✓ testforge.io/{effectiveSlug} {t.slugAvailable}
          </p>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="agreeTerms"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {t.agreePre}{" "}
          <Link href="/terms" className="text-indigo-600 hover:underline">
            {t.terms}
          </Link>{" "}
          {t.and}{" "}
          <Link href="/privacy" className="text-indigo-600 hover:underline">
            {t.privacy}
          </Link>
        </span>
      </label>

      <SubmitButton disabled={hasErrors} label={t.submit} pendingLabel={t.submitting} />
    </form>
  );
}
