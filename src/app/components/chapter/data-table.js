"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../data-table/data-table-template"


export function ChapterDataTable({ data }) {
  const columns = getColumns(data)

  return (
    <div>
      <TestingDataTable data={data} setPagination={true} columns={columns} setPageSize={20}/>
    </div>
  )
}