import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

/**
 * Radix-based Progress primitives matching the API used by PasswordStrengthIndicator.
 * Provides: Progress (root), ProgressTrack, ProgressIndicator
 */

function Progress({ className, value, children, ...props }) {
    return (
        <ProgressPrimitive.Root
            value={value}
            className={cn("flex flex-wrap gap-3", className)}
            {...props}
        >
            {children}
        </ProgressPrimitive.Root>
    )
}

function ProgressTrack({ className, children, ...props }) {
    return (
        <ProgressPrimitive.Root
            className={cn(
                "relative flex h-1 w-full items-center overflow-hidden rounded-full",
                className
            )}
            {...props}
        >
            {children}
        </ProgressPrimitive.Root>
    )
}

function ProgressIndicator({ className, ...props }) {
    return (
        <ProgressPrimitive.Indicator
            className={cn("h-full bg-primary transition-all", className)}
            style={{ transform: "translateX(0%)" }}
            {...props}
        />
    )
}

export { Progress, ProgressTrack, ProgressIndicator }
