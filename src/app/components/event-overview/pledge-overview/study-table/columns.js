import { DataTableSortedHeader } from "@/app/components/data-table/data-table-column-sort"
import { formatMonthDay } from "@/lib/utils"

export function getColumns(data) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[250px]" }
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
