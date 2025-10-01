import { DataTableSortedHeader } from "../data-table/data-table-column-sort"
import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function getColumns(data) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[200px]" }
    },
    {
      accessorKey: "attendance",
      header: "Attendance",
      cell: ({ getValue }) => {
        const chapter = getValue()
        return (
          <div className="flex flex-row gap-1">
            {chapter.absence_type ? <Badge className="border-primary/50 bg-primary/10 text-primary">{capitalizeFirstLetter(chapter.absence_type)}</Badge> : null}
            {!chapter.is_absent ? <Badge className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">Present</Badge> : <Badge className="bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700">Absent</Badge>}
          </div>
        )
      },
      meta: { widthClass: "min-w-[200px]" }
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
      meta: { widthClass: "min-w-[150px]" }
    }
  ]
}
