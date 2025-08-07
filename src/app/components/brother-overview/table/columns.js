import { formatMonthDay, capitalizeFirstLetter } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DataTableSortedHeader } from "../../data-table/data-table-column-sort"

export function getColumns(data) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "w-auto" }
    },
    {
      accessorKey: "active",
      header: "Active",
      cell: ({ getValue }) => {
        const active = getValue();
        return (
          <>
            {active
              ? <Badge className="border-green-700 bg-green-700/30 text-green-700 px-2">Active</Badge>
              : <Badge className="border-red-700 bg-red-700/30 text-red-700 px-2">Inactive</Badge>
            }
          </>
        )
      },
      sortingFn: (rowA, rowB, columnId) => {
        const activeA = rowA.original.active ? 1 : 0;
        const activeB = rowB.original.active ? 1 : 0;
        if (activeA !== activeB) {
          return activeB - activeA;
        }
        return rowA.original.name.toLowerCase().localeCompare(rowB.original.name.toLowerCase());
      },
      meta: { widthClass: "w-1/12" }
    },
    {
      header: "Total",
      cell: ({ row }) => {
        const total = row.original.committee_points;
        return <span>{total}</span>
      },
      meta: { widthClass: "w-auto" }
    },
    {
      accessorKey: "committee_points",
      header: "Committee Points",
      meta: { widthClass: "w-auto" }
    },
    {
      header: "Excused",
      cell: ({ row }) => {
        const count = row.original.event_absences.filter(x => x.absence_type === "excused").length;
        return <span>{count}</span>
      },
      meta: { widthClass: "w-auto" }
    },
    {
      header: "Unexcused",
      cell: ({ row }) => {
        const count = row.original.event_absences.filter(x => x.absence_type === "unexcused").length;
        return <span>{count}</span>
      },
      meta: { widthClass: "w-auto" }
    },
    {
      header: "Chapter 1",
      
    }
    // {
    //   accessorKey: "attendance",
    //   header: "Attendance",
    //   cell: ({ getValue }) => {
    //     const chapter = getValue()
    //     return (
    //       <div className="flex flex-row gap-1">
    //         {chapter.absence_type ? <Badge className="border-primary bg-primary/20 text-primary px-2">{capitalizeFirstLetter(chapter.absence_type)}</Badge> : null}
    //         {!chapter.is_absent ? <Badge className="border-green-700 bg-green-700/30 text-green-700 px-2">Present</Badge> : <Badge className="border-red-700 bg-red-700/30 text-red-700 px-2">Absent</Badge>}
    //       </div>
    //     )
    //   },
    //   meta: { widthClass: "w-2/5" }
    // },
    // {
    //   accessorKey: "event_date",
    //   header: ({ column }) => (
    //     <DataTableSortedHeader
    //       column={column}
    //       title="Date"
    //     />
    //   ),
    //   cell: ({ getValue }) => <p>{formatMonthDay(getValue())}</p>,
    //   sortingFn: "datetime",
    //   meta: { widthClass: "w-1/5" }
    // }
  ]
}
