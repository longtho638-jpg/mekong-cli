"use client";

import dynamic from "next/dynamic";
import { UnifiedNavigation } from "@/components/layout/UnifiedNavigation";

import { DesktopHeader } from "@/components/layout/DesktopHeader";

const PWAInstallPrompt = dynamic(() => import("@/components/PWAInstallPrompt").then(mod => mod.PWAInstallPrompt), {
  ssr: false,
});
const AICopilot = dynamic(() => import("@/components/ai/AICopilot").then(mod => mod.AICopilot), {
  ssr: false,
});

export function ClientLayoutWrapper() {
  return (
    <>
      <PWAInstallPrompt />
      <AICopilot />
      <DesktopHeader />
      <UnifiedNavigation />
    </>
  );
}

