import * as React from "react"
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"

// Thin wrappers over @base-ui/react Tooltip — API used by mode-toggle.jsx:
//   <TooltipProvider delay={...}>
//     <Tooltip>
//       <TooltipTrigger render={<Button .../>}>...</TooltipTrigger>
//       <TooltipContent side align sideOffset>...</TooltipContent>
//     </Tooltip>
//   </TooltipProvider>

function TooltipProvider({ delay, children, ...props }) {
  return (
    <BaseTooltip.Provider delay={delay} {...props}>
      {children}
    </BaseTooltip.Provider>
  )
}

function Tooltip({ children, ...props }) {
  return (
    <BaseTooltip.Root {...props}>
      {children}
    </BaseTooltip.Root>
  )
}

function TooltipTrigger({ render, children, ...props }) {
  return (
    <BaseTooltip.Trigger render={render} {...props}>
      {children}
    </BaseTooltip.Trigger>
  )
}

const TooltipContent = React.forwardRef(function TooltipContent(
  { className, side = "top", align = "center", sideOffset = 4, children, ...props },
  ref
) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} alignment={align} sideOffset={sideOffset}>
        <BaseTooltip.Popup
          ref={ref}
          className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
            className
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
