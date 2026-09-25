import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Create workspace" };

export default function SignUpPage() {
  return (
    <AuthScreen>
      <AuthForm mode="sign-up" />
    </AuthScreen>
  );
}
