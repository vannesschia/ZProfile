"use client"
import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function TestingDataTable({
  data,
  columns,
  setPagination = false,
  setPageSize = 10,
  initialSorting = [],
  sortingFns,
  emptyStateMessage = "No data available.",
  // optional controlled row selection
  rowSelection,
  setRowSelection,
  onSelectionChange,
}) {
  const [internalRowSelection, setInternalRowSelection] = useState({})
  const selectionState = rowSelection ?? internalRowSelection
  const setSelectionState = setRowSelection ?? setInternalRowSelection

  const table = useReactTable({
    data,
    columns,
    // Default-only sorting (no state/onChange, no header toggles)
    initialState: {
      sorting: initialSorting,
      pagination: { pageSize: setPageSize },
    },
    state: { rowSelection: selectionState },
    onRowSelectionChange: setSelectionState,
    sortingFns, // register your named custom sorters here
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  useEffect(() => {
    if (!onSelectionChange) return
    const selected = table.getSelectedRowModel().rows
    onSelectionChange(selected)
  }, [selectionState, table, onSelectionChange])

  return (
    <div>
      <div className="border rounded-md">
        <Table className="table-auto w-full">
          <TableHeader className="table-fixed w-full">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const widthClass = header.column.columnDef.meta?.widthClass ?? "flex-1"
                  return (
                    <TableHead key={header.id} className={cn(widthClass, "truncate")}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())
                      }
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getPaginationRowModel().rows.length ? (
              table.getPaginationRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  { emptyStateMessage }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {setPagination ? (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground leading-tight">{data.length} total items.</p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>

            {table.getPageCount() > 0 ? (
              <span className="text-sm text-muted-foreground mx-1">
                {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground mx-1">0/0</span>
            )}

            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
