import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Create your account — Orbital",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; import?: string }>;
}) {
  const { next, import: importFlag } = await searchParams;
  const notice =
    importFlag === "1"
      ? "Create an account to save the audit you just ran — it'll be waiting on your dashboard."
      : undefined;
  return <AuthForm mode="signup" next={next} notice={notice} />;
}
