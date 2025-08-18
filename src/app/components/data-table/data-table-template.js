"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TestingDataTable({ data, columns, setPagination = false, setPageSize = 7 }) {
  
  const table = useReactTable({
    data,
    columns,
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
      <div className="border rounded-md">
        <Table className="table-auto w-full">
          <TableHeader className="table-fixed w-full">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => {
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  No events.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {setPagination ? 
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-muted-foreground leading-tight">{data.length} total events attended.</p>
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
        : null
      }
    </div>
  )
}