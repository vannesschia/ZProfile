import { DataTableSortedHeader } from "../data-table/data-table-column-sort"
import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function getColumns(data) {
  const uniqueCommittees = Array.from(new Set(data.map(row => row.committee)))

  return [
    {
      accessorKey: "name",
      header: "Chapter",
      meta: { widthClass: "w-2/5" }
    },
    {
      accessorKey: "attendance",
      header: "Attendance",
      cell: ({ getValue }) => {
        const chapter = getValue()
        return (
          <div className="flex flex-row gap-1">
            {chapter.absence_type ? <Badge className="border-primary bg-primary/20 text-primary px-2">{capitalizeFirstLetter(chapter.absence_type)}</Badge> : null}
            {!chapter.is_absent ? <Badge className="border-green-700 bg-green-700/30 text-green-700 px-2">Present</Badge> : <Badge className="border-red-700 bg-red-700/30 text-red-700 px-2">Absent</Badge>}
          </div>
        )
      },
      meta: { widthClass: "w-2/5" }
    },
    {
      accessorKey: "event_date",
      header: ({ column }) => (
        <DataTableSortedHeader
          column={column}
          title="Date"
        />
      ),
      cell: ({ getValue }) => <p>{formatMonthDay(getValue())}</p>,
      sortingFn: "datetime",
      meta: { widthClass: "w-1/5" }
    }
  ]
}
