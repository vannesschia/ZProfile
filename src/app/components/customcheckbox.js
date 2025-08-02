// shadcn checkbox does not work when placed in a form

'use client'

import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CustomCheckbox({
  checked,
  className,
}) {
  return (
    <div
      className={cn(
        "flex h-4 w-4 border rounded-[4px] items-center justify-center shadow-xs transition-shadow outline-none", {
          "border-primary bg-primary": checked,
          "[&_svg]:invisible": !checked,
        },
        className
      )}
    >
      <CheckIcon
        size="icon"
        className={cn(
          {
            "text-primary-foreground": checked,
            "text-primary": !checked,
          }
        )}
      />
    </div>
  )
}