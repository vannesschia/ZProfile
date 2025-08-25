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
      <div className="w-full border-b-2 border-inherit px-6 py-4">
        <h2 className="text-2xl font-bold tracking-tight leading-tight">{ title }</h2>
      </div>
      <div className="p-6">
        { children }
      </div>
    </div>
  )
}

export function ProgressTabAdmin({title, children, className}) {
  return(
    <div className={cn("border-2 border-secondary rounded-lg", className)}>
      <div className="w-full px-6 py-4">
        <h2 className="text-base font-normal tracking-tight leading-tight text-muted-foreground">{ title }</h2>
      </div>
      <div className="px-6 pb-4 text-3xl font-semibold">
        { children }
      </div>
    </div>
  )
}