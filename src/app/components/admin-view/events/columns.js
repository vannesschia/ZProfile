import { Badge } from "@/components/ui/badge"
import { formatMonthDay } from "@/lib/utils"

export function getColumns(data) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "committee",
      header: "Committee",
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "event_date",
      header: "Date",
      cell: ({ getValue }) => {
        return (
          <p>{formatMonthDay(getValue())}</p>
        )
      },
      meta: { widthClass: "min-w-[200px]" },
    },
    {
      accessorKey: "attendance_count",
      header: "Attendance",  
      meta: { widthClass: "min-w-[200px]" }
    },
  ]
}
