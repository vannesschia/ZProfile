"use client"
import { getChapterColumns, getColumns, getDefaultColumns } from "./columns"
import { TestingDataTable } from "../../../../../components/data-table/data-table-template"


export function CommitteeEventsWithAttendance({ data }) {
  const columns = getColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events." initialSorting={[{ id: "event_date", desc: true }]}/>
    </div>
  )
}

export function ChapterWithAttendance({ data }) {
  const columns = getChapterColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events." initialSorting={[{ id: "event_date", desc: true }]}/>
    </div>
  )
}


export function DefaultEventsWithAttendance({ data }) {
  const columns = getDefaultColumns(data)

  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPageSize={20} emptyStateMessage="No events." initialSorting={[{ id: "event_date", desc: true }]}/>
    </div>
  )
}