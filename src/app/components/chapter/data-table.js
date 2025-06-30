"use client"
import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { getColumns } from "./columns"
import { TestingDataTable } from "../data-table/data-table-template"


export function ChapterDataTable({ data }) {
  const columns = getColumns(data)
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <TestingDataTable data={data} columns={columns}/>

      {/* <div className="flex items-center justify-between pt-4">
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
      </div> */}
    </div>
  )
}