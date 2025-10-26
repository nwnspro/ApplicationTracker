import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Job,
  JobStatus,
  JOB_STATUS_VALUES,
  JOB_STATUS_LABELS,
} from "../types/job";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { ExternalLink, Edit2, Trash2 } from "lucide-react";

interface JobTableProps {
  jobs: Job[];
  onUpdateJob: (id: string, updates: Partial<Job>) => void;
  onDeleteJob: (id: string) => void;
}

const columnHelper = createColumnHelper<Job>();

const statusOptions: readonly JobStatus[] = JOB_STATUS_VALUES;

const STATUS_COLORS: Record<JobStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-800",
  INTERVIEW_SCHEDULED: "bg-yellow-100 text-yellow-800",
  INTERVIEW_COMPLETED: "bg-purple-100 text-purple-800",
  INTERVIEWING: "bg-yellow-100 text-yellow-800",
  OFFER: "bg-green-100 text-green-800",
  OFFER_RECEIVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
  NO_RESPONSE: "bg-orange-100 text-orange-800",
};

export function JobTable({ jobs, onUpdateJob, onDeleteJob }: JobTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Job>>({});

  const columns = useMemo(
    () => [
      columnHelper.accessor("company", {
        header: "Company",
        cell: ({ row, getValue }) => {
          const isEditing = editingId === row.original.id;
          const value = getValue();

          if (isEditing) {
            return (
              <Input
                value={editingData.company || value}
                onChange={(e) =>
                  setEditingData((prev) => ({
                    ...prev,
                    company: e.target.value,
                  }))
                }
                className="w-full"
              />
            );
          }
          return value;
        },
      }),
      columnHelper.accessor("position", {
        header: "Job",
        cell: ({ row, getValue }) => {
          const isEditing = editingId === row.original.id;
          const value = getValue();

          if (isEditing) {
            return (
              <Input
                value={editingData.position || value}
                onChange={(e) =>
                  setEditingData((prev) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
                className="w-full"
              />
            );
          }
          return value;
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row, getValue }) => {
          const isEditing = editingId === row.original.id;
          const value = getValue();

          if (isEditing) {
            return (
              <Select
                value={(editingData.status ?? value) as JobStatus}
                onChange={(e) =>
                  setEditingData((prev) => ({
                    ...prev,
                    status: e.target.value as JobStatus,
                  }))
                }
                className="w-full"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {JOB_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            );
          }

          const status = value as JobStatus;
          const statusColor = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
          const statusLabel = JOB_STATUS_LABELS[status] ?? status;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
            >
              {statusLabel}
            </span>
          );
        },
      }),
      columnHelper.accessor("notes", {
        header: "Notes",
        cell: ({ row, getValue }) => {
          const isEditing = editingId === row.original.id;
          const value = getValue();

          if (isEditing) {
            return (
              <Input
                value={(editingData.notes ?? value) || ""}
                onChange={(e) =>
                  setEditingData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full"
              />
            );
          }
          return value;
        },
      }),
      columnHelper.accessor("appliedDate", {
        header: "Applied Date",
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;

          if (isEditing) {
            return (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onUpdateJob(row.original.id, editingData);
                    setEditingId(null);
                    setEditingData({});
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setEditingData({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(row.original.id);
                  setEditingData({});
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteJob(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {row.original.url && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const jobUrl = row.original.url;
                    if (!jobUrl) return;
                    window.open(jobUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    [editingId, editingData, onUpdateJob, onDeleteJob]
  );

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const rawStatusFilter = table.getColumn("status")?.getFilterValue();
  const statusFilterValue =
    typeof rawStatusFilter === "string" ? rawStatusFilter : "";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search companies or positions..."
          value={(table.getColumn("company")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("company")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          value={statusFilterValue}
          onChange={(event) =>
            table.getColumn("status")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {JOB_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
