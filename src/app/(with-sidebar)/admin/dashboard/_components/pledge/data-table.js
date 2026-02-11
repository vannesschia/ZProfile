"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../../../../components/data-table/data-table-template"


export function PledgeOverviewAdminTable({ data, milestones, currentMilestone, ccOverrides = {}, onUpdateCCRequired }) {
  const columns = getColumns({ milestones, currentMilestone, ccOverrides, onUpdateCCRequired })

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No pledges." initialSorting={[{ id: "name", desc: false }]}/>
    </div>
  )
}