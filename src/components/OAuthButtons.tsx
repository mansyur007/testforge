import { dict, type Lang } from "@/lib/i18n";

// OAuth Google & GitHub (AU-002/AU-003). Tombol mengarah ke route OAuth;
// jika credentials belum dikonfigurasi via env, route menampilkan pesan jelas.
export function OAuthButtons({
  mode,
  lang = "en",
}: {
  mode: "signup" | "login";
  lang?: Lang;
}) {
  const t = dict[lang].auth.login;
  const verb = mode === "signup" ? t.oauthSignup : t.oauthLogin;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <a
        href="/api/auth/oauth/google"
        className="flex items-center justify-center gap-2 rounded-lg border border-hairline-strong px-4 py-2.5 text-sm font-medium text-content hover:bg-canvas"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        {verb} Google
      </a>
      <a
        href="/api/auth/oauth/github"
        className="flex items-center justify-center gap-2 rounded-lg border border-hairline-strong px-4 py-2.5 text-sm font-medium text-content hover:bg-canvas"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        {verb} GitHub
      </a>
    </div>
  );
}
