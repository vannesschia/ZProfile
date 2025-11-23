"use client"
import { TestingDataTable } from "@/app/components/data-table/data-table-template"
import { getColumns } from "./columns"


export function OtherEventsDataTable({ data }) {
  const columns = getColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPagination={true} setPageSize={20}/>
    </div>
  )
}