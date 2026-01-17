import * as React from "react"
import { cn } from "~/lib/utils"
import { FileSearch } from "lucide-react"

interface EmptyProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode
}

function Empty({ className, children, ...props }: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function EmptyIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      <FileSearch className="w-12 h-12 text-slate-300" />
    </div>
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-semibold text-slate-900 mb-1", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-slate-500 max-w-sm", className)} {...props} />
  )
}

Empty.Icon = EmptyIcon
Empty.Title = EmptyTitle
Empty.Description = EmptyDescription

export { Empty }
