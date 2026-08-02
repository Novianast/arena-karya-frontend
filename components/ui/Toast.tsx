"use client";

import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

interface ToastProps {
  message: string;
  type?: string;
  show: boolean;
}

const styles: Record<string, string> = {
  success: "bg-[#00AC0B]/20 text-[#00AC0B]",
  error: "bg-red-500/20 text-red-500",
  warning: "bg-yellow-500/20 text-yellow-500",
};

const icons: Record<string, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

export default function Toast({ message, type = "success", show }: ToastProps) {
  if (!show) return null;

  const Icon = icons[type] ?? icons.success;

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold shadow-sm ${styles[type] || styles.success}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {message}
    </div>
  );
}