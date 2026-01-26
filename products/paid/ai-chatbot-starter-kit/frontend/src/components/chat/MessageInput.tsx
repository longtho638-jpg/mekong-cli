import * as React from "react"
import { SendHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="relative flex items-center max-w-4xl mx-auto">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={cn(
            "absolute right-2 p-2 rounded-md transition-colors",
            disabled || !input.trim()
              ? "text-muted-foreground cursor-not-allowed"
              : "text-primary hover:bg-muted"
          )}
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
