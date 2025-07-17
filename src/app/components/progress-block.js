import { cn } from "@/lib/utils"

export function ProgressBlock({title, subtext = "", children}) {
  return(
    <div className="w-full bg-background border-2 border-secondary p-6 rounded-lg">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">{ title }</h2>
          {subtext != "" ? <p className="text-sm tracking-tight">{ subtext }</p> : null}
        </div>
        <div>
          { children }
        </div>
      </div>
    </div>
  )
}

export function ProgressTab({title, children, className}) {
  return(
    <div className={cn("w-full min-w-fit bg-background border-2 border-secondary rounded-lg flex-shrink-0", className)}>
      <div className="w-full border-b-2 border-muted px-6 py-4">
        <h2 className="text-2xl font-bold tracking-tight leading-tight">{ title }</h2>
      </div>
      <div className="p-6">
        { children }
      </div>
    </div>
  )
}