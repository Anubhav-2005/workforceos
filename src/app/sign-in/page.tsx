import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthScreen>
      <AuthForm mode="sign-in" />
    </AuthScreen>
  );
}
