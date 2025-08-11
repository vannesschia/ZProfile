"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState } from "react"

export function TestingDataTable({
  data,
  columns,
  setPagination = false,
  setPageSize = 7,
  emptyStateMessage = "No events.",
  defaultSorting = [],
}) {
  const [sorting, setSorting] = useState(defaultSorting)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: setPageSize,
      },
    },
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <div className="border rounded-md overflow-x-auto w-full">
        <Table className="table-auto min-w-max">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.columnDef.meta?.widthClass ?? "min-w-[100px]",
                        "truncate cursor-pointer select-none"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUp size={14} />,
                          desc: <ArrowDown size={14} />,
                        }[header.column.getIsSorted()] ?? <ChevronsUpDown size={14} />}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getPaginationRowModel().rows.length ? (
              table.getPaginationRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-10 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {setPagination && (
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-muted-foreground leading-tight">
              {data.length} total events attended.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon" className="size-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>

            <span className="text-sm text-muted-foreground mx-1">
              {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="icon" className="size-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
