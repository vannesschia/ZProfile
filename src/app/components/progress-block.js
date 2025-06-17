export function ProgressBlock({title, currPoints, totalPoints, children}) {
  return(
    <div className="w-full bg-background border-2 border-secondary p-4 rounded-lg">
      <div className="flex flex-col gap-4">
        <p className="text-2xl font-semibold">{ title }</p>
        <div>
          { children }
        </div>
      </div>
    </div>
  )
}