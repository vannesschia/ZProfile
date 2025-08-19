"use client"
import { getChapterColumns, getColumns, getDefaultColumns } from "./columns"
import { TestingDataTable } from "../../data-table/data-table-template"


export function CommitteeEventsWithAttendance({ data }) {
  const columns = getColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events."/>
    </div>
  )
}

export function ChapterWithAttendance({ data }) {
  const columns = getChapterColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events."/>
    </div>
  )
}


export function DefaultEventsWithAttendance({ data }) {
  const columns = getDefaultColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events."/>
    </div>
  )
}