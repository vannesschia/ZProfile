"use client";

import { useMemo, useState, useTransition } from "react";
import { getBrowserClient } from "@/lib/supbaseClient";
import { toast } from "sonner";
import { TestingDataTable } from "@/app/components/data-table/data-table-template";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMonthDay } from "@/lib/utils";
import { Link2, Trash } from "lucide-react";

const statusBadgeMap = {
  approved: {
    text: "Approved",
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
  },
  pending: {
    text: "Pending",
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700",
  },
  denied: {
    text: "Denied",
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
  },
};

export default function ArchivePage({ initialData }) {
  const supabase = getBrowserClient();
  const [rows, setRows] = useState(initialData || []);
  const [isPending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);

  const deleteByIds = async (ids) => {
    if (!ids?.length) return;
    const { error } = await supabase.from("coffee_chats").delete().in("id", ids);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return false;
    }
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setRowSelection({});
    toast.success("Deleted successfully");
    return true;
  };

  const updateApproval = async (id, newStatus) => {
    const prev = rows;
    setRows((r) => r.map((row) => (row.id === id ? { ...row, approval: newStatus } : row)));

    const { error } = await supabase.from("coffee_chats").update({ approval: newStatus }).eq("id", id);
    if (error) {
      setRows(prev);
      toast.error(`Failed to update approval: ${error.message}`);
    } else {
      toast.success("Approval updated");
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox className="cursor-pointer"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        meta: { widthClass: "w-10" },
      },
      {
        accessorKey: "pledge_member.name",
        header: "Pledge",
        cell: ({ row, getValue }) => <span>{getValue() || row.original.pledge}</span>,
        meta: { widthClass: "min-w-[180px]" },
      },
      {
        accessorKey: "brother_member.name",
        header: "Brother",
        cell: ({ row, getValue }) => <span>{getValue() || row.original.brother}</span>,
        meta: { widthClass: "min-w-[180px]" },
      },
      {
        accessorKey: "chat_date",
        header: "Date",
        cell: ({ getValue }) => <span>{formatMonthDay(getValue())}</span>,
        meta: { widthClass: "min-w-[140px]" },
      },
      {
        accessorKey: "image_proof",
        header: "Selfie",
        cell: ({ getValue }) => {
          const image = getValue();
          return image ? (
            <a
              href={image}
              alt="Coffee Chat Selfie"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-row items-center gap-1"
            >
              <Link2 className="h-4 w-4" />
            </a>
          ) : (
            <span>-</span>
          );
        },
        meta: { widthClass: "min-w-[60px]" },
      },
      {
        accessorKey: "approval",
        header: "Approval",
        cell: ({ row, getValue }) => {
          const value = getValue();
          return (
            <div className="flex items-center gap-2 cursor-pointer">
              <Badge className={`${statusBadgeMap[value]?.className || ""} px-2`}>
                {statusBadgeMap[value]?.text || value}
              </Badge>
              <Select
                value={value}
                onValueChange={(v) => startTransition(() => updateApproval(row.original.id, v))}
              >
                <SelectTrigger className="h-7 w-[140px] cursor-pointer">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        },
        meta: { widthClass: "min-w-[220px]" },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 cursor-pointer"
            onClick={async () => {
              const ok = window.confirm("Delete this coffee chat? This cannot be undone.");
              if (!ok) return;
              await deleteByIds([row.original.id]);
            }}
          >
            <Trash className="h-4 w-4" />
            
          </Button>
        ),
        meta: { widthClass: "min-w-[40px]" },
      },
    ],
    [rows]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} total coffee chats</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.length === 0}
            onClick={async () => {
              const ids = selectedRows.map((r) => r.original.id)
              const { error } = await supabase.from("coffee_chats").update({ approval: "approved" }).in("id", ids)
              if (error) {
                toast.error(`Bulk approve failed: ${error.message}`)
                return
              }
              setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, approval: "approved" } : r)))
              setRowSelection({})
              toast.success("Selected chats approved")
            }}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.length === 0}
            onClick={async () => {
              const ids = selectedRows.map((r) => r.original.id)
              const { error } = await supabase.from("coffee_chats").update({ approval: "denied" }).in("id", ids)
              if (error) {
                toast.error(`Bulk deny failed: ${error.message}`)
                return
              }
              setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, approval: "denied" } : r)))
              setRowSelection({})
              toast.success("Selected chats denied")
            }}
          >
            Deny
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            disabled={selectedRows.length === 0}
            onClick={async () => {
              const ok = window.confirm(`Delete ${selectedRows.length} selected item(s)? This cannot be undone.`)
              if (!ok) return
              const ids = selectedRows.map((r) => r.original.id)
              await deleteByIds(ids)
            }}
          >
            <Trash className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      <TestingDataTable
        data={rows}
        columns={columns}
        setPagination={true}
        setPageSize={20}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onSelectionChange={(selected) => setSelectedRows(selected)}
      />
    </div>
  );
}

