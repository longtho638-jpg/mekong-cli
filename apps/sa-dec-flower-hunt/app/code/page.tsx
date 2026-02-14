import { Metadata } from "next";
import { CodePageClient } from "@/components/code/CodePageClient";

export const metadata: Metadata = {
  title: "Code Explorer | Admin",
  description: "View project source code",
};

export default function CodePage() {
  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/assets/digital-twins/agrios_lab_hyperreal_1765368168487.png" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-stone-950/90" />
      </div>
      <div className="relative z-10">
        <CodePageClient />
      </div>
    </div>
  );
}
