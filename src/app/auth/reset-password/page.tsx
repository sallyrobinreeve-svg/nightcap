import { redirect } from "next/navigation";

/** Password reset is no longer used — accounts sign in with an SMS code. */
export default function ResetPasswordPage() {
  redirect("/auth/signin");
}
