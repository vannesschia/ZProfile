"use client"
import { TestingDataTable } from "../data-table/data-table-template"
import { getColumns } from "./columns"


export function DataTable({ data }) {
  const columns = getColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPagination={true} emptyStateMessage="No events."/>
    </div>
  )
}