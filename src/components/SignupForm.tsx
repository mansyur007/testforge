import { OAuthButtons } from "@/components/OAuthButtons";
import { type Lang } from "@/lib/i18n";

// Signup hanya via OAuth (Google/GitHub). Provider mengembalikan email yang
// sudah terverifikasi, sehingga tidak perlu form email/password maupun SMTP.
export function SignupForm({ lang }: { lang: Lang }) {
  return <OAuthButtons mode="signup" lang={lang} />;
}
