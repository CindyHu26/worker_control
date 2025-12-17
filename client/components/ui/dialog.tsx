"use client"

import * as React from "react"

interface DialogContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

export const Dialog = ({ children, open: controlledOpen, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen

    const setOpen = (newOpen: boolean) => {
        if (!isControlled) {
            setUncontrolledOpen(newOpen)
        }
        if (onOpenChange) {
            onOpenChange(newOpen)
        }
    }

    return (
        <DialogContext.Provider value={{ open, setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

export const DialogTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
    const context = React.useContext(DialogContext)
    if (!context) throw new Error("DialogTrigger must be used within Dialog")

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                // call original onClick if exists
                const originalOnClick = (children.props as any).onClick;
                if (originalOnClick) originalOnClick(e);
                context.setOpen(true)
            }
        })
    }

    return (
        <button onClick={() => context.setOpen(true)}>
            {children}
        </button>
    )
}

export const DialogContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const context = React.useContext(DialogContext)
    if (!context) throw new Error("DialogContent must be used within Dialog")

    if (!context.open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0" onClick={() => context.setOpen(false)}></div>

            {/* Modal content */}
            <div className={`relative z-50 w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg sm:rounded-lg ${className}`}>
                <button
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={() => context.setOpen(false)}
                >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
                </button>
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
            {children}
        </div>
    )
}

export const DialogTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    return (
        <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
            {children}
        </h2>
    )
}
