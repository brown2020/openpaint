import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Sign Up · OpenPaint",
  description: "Create an OpenPaint account to save cloud projects.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Start saving your vector projects to the cloud"
    >
      <div className="space-y-6">
        <GoogleSignInButton redirectTo="/" />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-700">
              or continue with email
            </span>
          </div>
        </div>
        <SignUpForm useLinks redirectTo="/" />
      </div>
    </AuthShell>
  );
}
