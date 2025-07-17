import { DataTableSortedHeader } from "../../data-table/data-table-column-sort"
import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function getColumns(data) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "w-4/5" }
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
