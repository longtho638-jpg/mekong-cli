import * as React from "react"

const Select = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const SelectTrigger = ({ children }: { children: React.ReactNode }) => <button className="border p-2 rounded w-full text-left">{children}</button>
const SelectValue = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
const SelectContent = ({ children }: { children: React.ReactNode }) => <div className="absolute border bg-white p-2 mt-1 rounded shadow-lg">{children}</div>

interface SelectItemProps {
    children: React.ReactNode;
    value: string;
}

const SelectItem = ({ children, value }: SelectItemProps) => <div className="p-2 hover:bg-gray-100 cursor-pointer">{children}</div>

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
