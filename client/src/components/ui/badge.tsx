import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 no-default-hover-elevate no-default-active-elevate whitespace-nowrap overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-primary-border bg-primary text-primary-foreground shadow",
        secondary: "border-secondary-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive-border bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
