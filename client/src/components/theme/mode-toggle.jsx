import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function ModeToggle({
  className = "",
  variant = "outline",
  size = "icon",
  side = "top",
  align = "center",
  sideOffset = 6,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={variant}
              size={size}
              onClick={toggleTheme}
              className={`relative ${className}`}
              aria-label="Toggle theme"
            />
          }
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="font-medium"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <span>Switch to {theme === "dark" ? "light" : "dark"} mode</span>
            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded bg-muted/30 px-1.5 font-mono text-[10px] font-semibold text-primary-foreground border border-primary-foreground/20">
              d
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ModeToggle;
