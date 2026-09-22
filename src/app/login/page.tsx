import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Sign In · OpenPaint",
  description: "Sign in to OpenPaint to save and open cloud projects.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Save projects to the cloud and open them anywhere"
    >
      <div className="space-y-6">
        <GoogleSignInButton redirectTo="/" />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              or continue with email
            </span>
          </div>
        </div>
        <LoginForm useLinks redirectTo="/" />
      </div>
    </AuthShell>
  );
}
