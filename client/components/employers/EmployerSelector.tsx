"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

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

interface Employer {
    id: string
    companyName: string
    taxId: string | null
}

interface EmployerSelectorProps {
    value?: string
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
}

export default function EmployerSelector({
    value,
    onChange,
    disabled = false,
    placeholder = "選擇雇主..."
}: EmployerSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [employers, setEmployers] = React.useState<Employer[]>([])
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        const fetchEmployers = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/employers?limit=500')
                const data = await res.json()
                setEmployers(data.data || [])
            } catch (error) {
                console.error("Failed to fetch employers:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchEmployers()
    }, [])

    const selectedEmployer = employers.find((emp) => emp.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                    disabled={disabled || loading}
                >
                    {selectedEmployer
                        ? `${selectedEmployer.companyName} (${selectedEmployer.taxId || '無統編'})`
                        : loading ? "載入中..." : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="搜尋名稱或統編..." />
                    <CommandList>
                        <CommandEmpty>找不到符合的雇主</CommandEmpty>
                        <CommandGroup>
                            {employers.map((emp) => (
                                <CommandItem
                                    key={emp.id}
                                    value={`${emp.companyName} ${emp.taxId}`}
                                    onSelect={(currentValue) => {
                                        onChange(emp.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === emp.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{emp.companyName}</span>
                                        <span className="text-xs text-slate-500 font-mono">{emp.taxId || '無統編'}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
