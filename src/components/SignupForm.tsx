"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/OAuthButtons";
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

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function PasswordInput({
  name,
  value,
  onChange,
  onBlur,
  className,
  showLabel,
  hideLabel,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  className: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="••••••••"
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
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
    <>
      <OAuthButtons mode="signup" lang={lang} />
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        {t.orEmail}
        <span className="h-px flex-1 bg-slate-200" />
      </div>
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
            <PasswordInput
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => blur("password")}
              className={`${inputCls} ${border("password")}`}
              showLabel={t.showPassword}
              hideLabel={t.hidePassword}
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
            <PasswordInput
              name="confirmPassword"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => blur("confirm")}
              className={`${inputCls} ${border("confirm")}`}
              showLabel={t.showPassword}
              hideLabel={t.hidePassword}
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
    </>
  );
}
