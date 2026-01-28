import * as React from "react"
import { cn } from "@/lib/utils"

const Dialog = ({ children, open, onOpenChange }: any) => {
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
const DialogTrigger = ({ children, asChild, onClick }: any) => {
    if (asChild) {
        return React.cloneElement(children, { onClick });
    }
    return <button onClick={onClick}>{children}</button>;
}
const DialogContent = ({ children }: any) => <div>{children}</div>
const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-bold">{children}</h2>
const DialogDescription = ({ children }: any) => <p className="text-sm text-gray-500">{children}</p>
const DialogFooter = ({ children }: any) => <div className="mt-4 flex justify-end gap-2">{children}</div>

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
