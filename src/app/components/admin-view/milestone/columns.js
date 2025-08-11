import { DataTableSortedHeader } from "../../data-table/data-table-column-sort"
import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { XCircle, CheckCircle2, CircleDashed } from "lucide-react"

export function getColumns(data) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "total_committee_points",
      header: "Committee Points",
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "total_coffee_chats",
      header: "Coffee Chats",
      meta: { widthClass: "min-w-[200px]" },
    },
    {
      accessorKey: "absences",
      header: "Absence",
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="flex flex-row items-center gap-1">
            <Badge variant="outline">{value.excused} Excused</Badge>
            <Badge variant="outline">{value.unexcused} Unexcused</Badge>
          </div>
        )
      },  
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "chapter_events_attended",
      header: "Chapters",
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { widthClass: "min-w-[200px]" },
      cell: ({ getValue }) => {
        const status = getValue()
        if (status === "late") {
          return (
            <Badge variant="outline"><XCircle className="text-red-700"/> Late</Badge>
          )
        } else if (status === "on_track") {
          return (
            <Badge variant="outline"><CircleDashed className="text-neutral-700"/> On Track</Badge>
          )
        } else {
          return (
            <Badge variant="outline"><CheckCircle2 className="text-green-700"/> Completed</Badge>
          )
        }
      }
    }
  ]
}
