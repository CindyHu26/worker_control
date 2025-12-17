import * as React from "react"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

        // Variant styles
        const variants: Record<string, string> = {
            default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
            destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
            outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
            ghost: "hover:bg-slate-100 hover:text-slate-900",
            link: "text-slate-900 underline-offset-4 hover:underline",
        }

        // Size styles
        const sizes: Record<string, string> = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        const variantClass = variants[variant] || variants.default
        const sizeClass = sizes[size] || sizes.default

        // Combine classes
        const combinedClassName = `${baseStyles} ${variantClass} ${sizeClass} ${className}`.trim()

        // If asChild is true, valid implementation would need to clone generic child etc.
        // But since we are mocking/implementing simply, and Button usage in DocGenerator doesn't use asChild (except likely implicitly if Trigger uses it?)
        // Actually DialogTrigger uses asChild. But Button itself in DocGenerator is:
        // <Button variant="outline" ...> and <Button size="sm" ...>
        // So we can ignore asChild for the Button component ITSELF unless `DialogTrigger` passes `asChild` to `Button`? No, `DialogTrigger` wraps `Button`, and uses `asChild` on ITSELF to render the Button. Button doesn't use asChild here.

        return (
            <button
                className={combinedClassName}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
