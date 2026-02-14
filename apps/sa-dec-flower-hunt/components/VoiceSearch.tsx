"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"

interface VoiceSearchProps {
    onSearch: (query: string) => void
}

export function VoiceSearch({ onSearch }: VoiceSearchProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const { language } = useLanguage()

    useEffect(() => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSupported(true)
        }
    }, [])

    const startListening = () => {
        if (!isSupported) return

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.lang = language === "vi" ? "vi-VN" : "en-US"
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            onSearch(transcript)
        }

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error)
            setIsListening(false)
            toast.error("Không thể nhận diện giọng nói. Vui lòng thử lại.")
        }

        recognition.start()
    }

    if (!isSupported) return null

    return (
        <Button
            size="icon"
            variant="ghost"
            className={`rounded-full transition-all ${isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-stone-400 hover:text-stone-600"}`}
            onClick={startListening}
            disabled={isListening}
        >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
    )
}
