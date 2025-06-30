import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function DataTableSortedHeader({ column, title, className }) {
  const currentSort = column.getIsSorted()

  const handleClick = () => {
    if (currentSort === "asc") {
      column.toggleSorting(true)
    } else if (currentSort === "desc") {
      column.clearSorting()
    } else {
      column.toggleSorting(false)
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="data-[state=open]:bg-accent -ml-3 h-8"
      >
        {title}
        {currentSort === "asc" && <ArrowUp className="h-4 w-4" />}
        {currentSort === "desc" && <ArrowDown className="h-4 w-4" />}
        {!currentSort && <ChevronsUpDown className="h-4 w-4" />}
      </Button>
    </div>
  )
}
