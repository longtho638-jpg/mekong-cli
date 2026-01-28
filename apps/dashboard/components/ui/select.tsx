import * as React from "react"

const Select = ({ children }: any) => <div>{children}</div>
const SelectTrigger = ({ children }: any) => <button className="border p-2 rounded w-full text-left">{children}</button>
const SelectValue = ({ children }: any) => <span>{children}</span>
const SelectContent = ({ children }: any) => <div className="absolute border bg-white p-2 mt-1 rounded shadow-lg">{children}</div>
const SelectItem = ({ children, value }: any) => <div className="p-2 hover:bg-gray-100 cursor-pointer">{children}</div>

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
