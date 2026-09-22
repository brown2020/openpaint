import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-3xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          OpenPaint
        </Link>
        {subtitle ? <p className="mt-2 text-gray-600">{subtitle}</p> : null}
      </div>
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
