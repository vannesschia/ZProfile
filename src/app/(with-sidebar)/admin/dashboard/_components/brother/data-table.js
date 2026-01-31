"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../../../../components/data-table/data-table-template"

export function BrotherOverviewAdminTable({ data, requirement }) {
  const columns = getColumns({ data, requirement })

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} setPagination={true} emptyStateMessage="No brothers." initialSorting={[]}/>
    </div>
  )
}