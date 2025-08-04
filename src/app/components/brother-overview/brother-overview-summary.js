export default async function BrotherOverviewSummary() {
  return (
    <div className="grid grid-cols-5 gap-8 w-fit">
      <div className="flex flex-col">
        <span className="font-bold">16</span>
        <span className="text-sm font-light text-muted-foreground">Attendance Points</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">4</span>
        <span className="text-sm font-light text-muted-foreground">Committee Points</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">12/31</span>
        <span className="text-sm font-light text-muted-foreground">Due by</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">0</span>
        <span className="text-sm font-light text-muted-foreground">Completed</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">1</span>
        <span className="text-sm font-light text-muted-foreground">On track</span>
      </div>
    </div>
  )
}