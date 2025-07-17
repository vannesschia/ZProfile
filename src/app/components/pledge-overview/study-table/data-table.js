"use client"
import { ChevronRight, ChevronLeft } from "lucide-react"
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../data-table/data-table-template"


export function StudyTableDataTable({ data }) {
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
      <TestingDataTable data={data} columns={columns} setPagination={true}/>
    </div>
  )
}