import { redirect } from "next/navigation";

// HP-002: seluruh alur pendaftaran kini di /signup
export default function RegisterPage() {
  redirect("/signup");
}
