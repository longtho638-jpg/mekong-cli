"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";
import confetti from "canvas-confetti";
import { AudienceSelector, AUDIENCES } from "@/components/admin/campaign/AudienceSelector";
import { MessageComposer } from "@/components/admin/campaign/MessageComposer";
import { CampaignPreview } from "@/components/admin/campaign/CampaignPreview";

export default function CampaignManager() {
    const [step, setStep] = useState(1);
    const [audience, setAudience] = useState("all");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSend = async () => {
        setIsSending(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsSending(false);
        setIsSent(true);

        // WOW Effect
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#EF4444', '#F59E0B']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#EF4444', '#F59E0B']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const reset = () => {
        setStep(1);
        setIsSent(false);
        setMessage("");
    };

    const selectedAudienceCount = AUDIENCES.find(a => a.id === audience)?.count || 0;

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                    <Rocket className="w-8 h-8 text-red-500" />
                    Growth Engine
                </h1>
                <p className="text-stone-500">Hệ thống Retargeting & CSKH tự động</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Wizard */}
                <div className="lg:col-span-2 space-y-6">
                    <AudienceSelector
                        selectedAudience={audience}
                        isActive={step === 1}
                        onSelect={(id) => { setAudience(id); setStep(2); }}
                    />

                    <MessageComposer
                        message={message}
                        isActive={step === 2}
                        onChange={setMessage}
                        onNext={() => setStep(3)}
                    />
                </div>

                {/* Right Column: Preview & Action */}
                <div className="lg:col-span-1">
                    <CampaignPreview
                        message={message}
                        audienceCount={selectedAudienceCount}
                        isSending={isSending}
                        isSent={isSent}
                        canSend={step >= 3}
                        onSend={handleSend}
                        onReset={reset}
                    />
                </div>
            </div>
        </div>
    );
}
