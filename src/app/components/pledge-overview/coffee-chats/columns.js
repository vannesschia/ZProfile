import { DataTableSortedHeader } from "../../data-table/data-table-column-sort"
import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function getColumns(data) {
  const statusBadgeMap = {
    approved: {
      text: "Approved",
      className: "bg-green-50 border-green-200 text-green-800",
    },
    pending: {
      text: "Pending",
      className: "bg-amber-50 border-amber-200 text-amber-800",
    },
    denied: {
      text: "Denied",
      className: "bg-red-50 border-red-200 text-red-800",
    },
  };

  return [
    {
      accessorKey: "brother_name.name",
      header: "Name",
      meta: { widthClass: "min-w-[250px]" }
    },
    {
      accessorKey: "approval",
      header: "Approval",
      cell: ({ getValue }) => {
        const approval = getValue();
        const badge = statusBadgeMap[approval];
        return (
          <Badge className={`${badge.className} px-2`}>
            {badge.text}
          </Badge>
        )
      },
      meta: { widthClass: "min-w-[150px]" }
    },
    {
      accessorKey: "chat_date",
      header: ({ column }) => (
        <DataTableSortedHeader
          column={column}
          title="Date"
        />
      ),
      cell: ({ getValue }) => <p>{formatMonthDay(getValue())}</p>,
      sortingFn: "datetime",
      meta: { widthClass: "min-w-[150px]" }
    },
    {
      accessorKey: "selfie",
      header: "Selfie",
      cell: ({ getValue }) => {
        const image = getValue();
        return (
          <p>-</p>
        )
      },
      meta: { widthClass: "min-w-[150px]" }
    }
  ]
}