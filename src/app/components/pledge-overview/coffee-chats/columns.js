import { DataTableSortedHeader } from "../../data-table/data-table-column-sort"
import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function getColumns(data) {
  const statusBadgeMap = {
    approved: {
      text: "Approved",
      className: "border-green-700 bg-green-700/30 text-green-700",
    },
    pending: {
      text: "Pending",
      className: "border-yellow-700 bg-yellow-700/30 text-yellow-700",
    },
    denied: {
      text: "Denied",
      className: "border-red-700 bg-red-700/30 text-red-700",
    },
  };

  return [
    {
      accessorKey: "brother_name.name",
      header: "Name",
      meta: { widthClass: "w-2/5" }
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
      meta: { widthClass: "w-1/5" }
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
      meta: { widthClass: "w-1/5" }
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
      meta: { widthClass: "w-1/5" }
    }
  ]
}