export function ProgressBlock({title, currPoints, totalPoints, children}) {
  return(
    <div className="w-full bg-background border-2 border-secondary p-4 rounded-lg">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-semibold tracking-tight">{ title }</h2>
        <div>
          { children }
        </div>
      </div>
    </div>
  )
}