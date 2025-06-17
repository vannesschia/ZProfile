import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { capitalizeFirstLetter } from "@/lib/utils"

export function DataTableColumnHeader({ column, title, className, filterOptions = [] }) {
  // const isCommittee = column.id === "committee"
  // const current = column.getFilterValue() || ""

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8"
          >
            <span>{title}</span>
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {["All", ...filterOptions].map((committee) => (
              <DropdownMenuItem
                key={committee}
                onClick={() =>
                  column.setFilterValue(committee === "All" ? "" : committee)
                }
              >
                {capitalizeFirstLetter(committee)}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

