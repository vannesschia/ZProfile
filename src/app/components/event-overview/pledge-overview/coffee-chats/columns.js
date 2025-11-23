import { DataTableSortedHeader } from "@/app/components/data-table/data-table-column-sort"
import { formatMonthDay } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Link2 } from "lucide-react";

export function getColumns(data) {
  const statusBadgeMap = {
    approved: {
      text: "Approved",
      className: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
    },
    pending: {
      text: "Pending",
      className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700",
    },
    denied: {
      text: "Denied",
      className: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
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
      accessorKey: "image_proof",
      header: "Selfie",
      cell: ({ getValue }) => {
        const image = getValue();
        if (image) {
          return (
            <a 
              href={image} 
              alt="Coffee Chat Selfie" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex flex-row items-center gap-1"
            >
              <Link2 className="h-4 w-4" />
            </a>
          )
        }
        return (
          <p>-</p>
        )
      },
      meta: { widthClass: "min-w-[50px]" }
    }
  ]
}