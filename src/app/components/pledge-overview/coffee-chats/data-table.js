"use client"
import { getColumns } from "./columns"
import { TestingDataTable } from "../../data-table/data-table-template"


export function CoffeeChatsTable({ data }) {
  const columns = getColumns(data)
  return (
    <div>
      <TestingDataTable data={data} columns={columns} setPagination={true} />
    </div>
  )
}