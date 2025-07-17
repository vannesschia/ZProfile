"use client"
import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"
import { TestingDataTable } from "../data-table/data-table-template"
import { Button } from "@/components/ui/button"
import { getColumns } from "./columns"
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel
} from "@tanstack/react-table"


export function DataTable({ data }) {
  const columns = getColumns(data)
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPagination={true} />
    </div>
  )
}