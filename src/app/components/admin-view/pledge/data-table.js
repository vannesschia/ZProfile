"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../data-table/data-table-template"


export function PledgeOverviewAdminTable({ data, milestones, currentMilestone }) {
  const columns = getColumns({ milestones, currentMilestone })

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No pledges."/>
    </div>
  )
}