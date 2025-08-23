import { DataTableColumnHeader } from "../data-table/data-table-column-header"
import { DataTableSortedHeader } from "../data-table/data-table-column-sort"
import { capitalizeFirstLetter, formatMonthDay } from "@/lib/utils"

export const getColumns = (data) => {
  const rows = Array.isArray(data) ? data : [];
  const uniqueCommittees = [...new Set(rows.map(r => r.committee))];

  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[250px]" }
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
