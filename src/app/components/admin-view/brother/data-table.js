"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../data-table/data-table-template"

export function BrotherOverviewAdminTable({ data, requirement }) {
  const columns = getColumns({ data, requirement })

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No brothers." initialSorting={[{ id: "name", desc: false }]}/>
    </div>
  )
}