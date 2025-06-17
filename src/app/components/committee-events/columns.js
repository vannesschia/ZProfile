// column.js
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableSortedHeader } from "./data-table-column-sort"
import { Badge } from "@/components/ui/badge"
import { capitalizeFirstLetter, formatMonthDay } from "@/lib/utils"

export function getColumns(data) {
  const uniqueCommittees = Array.from(new Set(data.map(row => row.committee)))

  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "committee",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Committee"
          filterOptions={uniqueCommittees}
        />
      ),
      cell: ({ getValue }) => (
        <p>{capitalizeFirstLetter(getValue())}</p>
      ),
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
    }
  ]
}
