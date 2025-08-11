"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../data-table/data-table-template"


export function CommitteeEventsWithAttendance({ data }) {
  const columns = getColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events."/>
    </div>
  )
}