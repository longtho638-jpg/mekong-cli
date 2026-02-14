import { Check } from "lucide-react"

export function StepIndicator({ step }: { step: number }) {
    return (
        <div className="flex justify-between mb-8 px-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= i
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-transparent border-stone-300 text-stone-300"
                        }`}>
                        {step > i ? <Check className="w-6 h-6" /> : i}
                    </div>
                    <span className="text-xs mt-2 text-stone-500">
                        {i === 1 ? "Thông tin" : i === 2 ? "Vườn hoa" : "Xác nhận"}
                    </span>
                </div>
            ))}
        </div>
    )
}
