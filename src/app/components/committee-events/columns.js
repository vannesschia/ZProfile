import { DataTableColumnHeader } from "../data-table/data-table-column-header"
import { DataTableSortedHeader } from "../data-table/data-table-column-sort"
import { capitalizeFirstLetter, formatMonthDay } from "@/lib/utils"

export const getColumns = (data) => {
  const uniqueCommittees = Array.from(new Set(data.map(row => row.committee)))

  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "w-2/5" }
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
