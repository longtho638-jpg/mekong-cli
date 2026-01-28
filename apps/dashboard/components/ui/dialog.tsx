import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange: (open: boolean) => void;
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                {children}
                <button onClick={() => onOpenChange(false)} className="absolute top-2 right-2">X</button>
            </div>
        </div>
    )
}

interface DialogTriggerProps {
    children: React.ReactElement;
    asChild?: boolean;
    onClick?: () => void;
}

const DialogTrigger = ({ children, asChild, onClick }: DialogTriggerProps) => {
    if (asChild) {
        return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick });
    }
    return <button onClick={onClick}>{children}</button>;
}

const DialogContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-4">{children}</div>
const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-bold">{children}</h2>
const DialogDescription = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-500">{children}</p>
const DialogFooter = ({ children }: { children: React.ReactNode }) => <div className="mt-4 flex justify-end gap-2">{children}</div>

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
