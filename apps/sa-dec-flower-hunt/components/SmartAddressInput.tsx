"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin, Navigation } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

const LOCATIONS = [
    { value: "sa dec", label: "TP. Sa Đéc, Đồng Tháp" },
    { value: "cao lanh", label: "TP. Cao Lãnh, Đồng Tháp" },
    { value: "quan 1", label: "Quận 1, TP. Hồ Chí Minh" },
    { value: "quan 3", label: "Quận 3, TP. Hồ Chí Minh" },
    { value: "quan 7", label: "Quận 7, TP. Hồ Chí Minh" },
    { value: "binh thanh", label: "Quận Bình Thạnh, TP. Hồ Chí Minh" },
    { value: "thu duc", label: "TP. Thủ Đức, TP. Hồ Chí Minh" },
    { value: "can tho", label: "TP. Cần Thơ" },
    { value: "vinh long", label: "TP. Vĩnh Long" },
]

interface SmartAddressInputProps {
    value: string
    onChange: (value: string) => void
}

export function SmartAddressInput({ value, onChange }: SmartAddressInputProps) {
    const [open, setOpen] = useState(false)
    const [isLocating, setIsLocating] = useState(false)

    const handleLocateMe = () => {
        setIsLocating(true)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Simulate reverse geocoding
                    setTimeout(() => {
                        onChange("Vị trí hiện tại (Đã xác định qua GPS)")
                        setIsLocating(false)
                    }, 1000)
                },
                (error) => {
                    console.error("Error locating:", error)
                    setIsLocating(false)
                }
            )
        } else {
            setIsLocating(false)
        }
    }

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 rounded-2xl border-stone-200 text-stone-600"
                    >
                        {value ? (
                            <div className="flex items-center truncate">
                                <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                {value}
                            </div>
                        ) : (
                            <span className="text-stone-400">Chọn địa chỉ giao hàng...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Tìm quận/huyện..." />
                        <CommandList>
                            <CommandEmpty>Không tìm thấy địa điểm.</CommandEmpty>
                            <CommandGroup heading="Gợi ý phổ biến">
                                {LOCATIONS.map((location) => (
                                    <CommandItem
                                        key={location.value}
                                        value={location.label}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? "" : currentValue)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === location.label ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {location.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Button
                type="button"
                variant="secondary"
                className="h-12 w-12 rounded-2xl p-0 shrink-0 bg-stone-100 hover:bg-stone-200"
                onClick={handleLocateMe}
                disabled={isLocating}
            >
                <Navigation className={cn("h-5 w-5 text-stone-600", isLocating && "animate-pulse text-blue-500")} />
            </Button>
        </div>
    )
}
