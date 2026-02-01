"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { EmailLinkForm } from "./EmailLinkForm";

type AuthTab = "login" | "signup" | "email-link";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  initialTab?: AuthTab;
  closable?: boolean;
}

/**
 * Main authentication modal with tabs for login, signup, and email link
 */
export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = "login",
  closable = true,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  const tabs: { id: AuthTab; label: string }[] = [
    { id: "login", label: "Sign In" },
    { id: "signup", label: "Sign Up" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closable ? onClose : undefined}
      title="Welcome to OpenPaint"
      size="sm"
    >
      <div className="space-y-6">
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id || (activeTab === "email-link" && tab.id === "login")
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Google sign-in */}
        <div>
          <GoogleSignInButton onSuccess={handleSuccess} />
        </div>

        {/* Divider */}
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

        {/* Tab content */}
        {activeTab === "login" && (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToSignUp={() => setActiveTab("signup")}
            onSwitchToEmailLink={() => setActiveTab("email-link")}
          />
        )}

        {activeTab === "signup" && (
          <SignUpForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setActiveTab("login")}
          />
        )}

        {activeTab === "email-link" && (
          <EmailLinkForm onSwitchToPassword={() => setActiveTab("login")} />
        )}

        {/* Terms notice */}
        <p className="text-xs text-center text-gray-500">
          By continuing, you agree to OpenPaint&apos;s Terms of Service and
          Privacy Policy.
        </p>
      </div>
    </Modal>
  );
}
