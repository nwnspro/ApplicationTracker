import { useState, useMemo } from "react";

import { JobStatsComponent } from "./JobStats";
import { TodoList } from "./TodoList";
import { Job } from "../types/job";
import { Search, Frown, Plus } from "lucide-react";

import { ShareMenu } from "./ShareMenu";
import { getTableExportOptions } from "../utils/exportUtils";

interface ContentProps {
  viewMode: "table" | "stats" | "todos";
  jobs: Job[];
  stats: any;
  onUpdateJob: (id: string, updates: Partial<Job>) => void;
  onDeleteJob: (id: string) => void;
  onAddJob: (jobData: Omit<Job, "id" | "lastUpdated">) => void;
  onExport: () => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
}

export function Content({
  viewMode,
  jobs,
  stats,
  onUpdateJob,
  onDeleteJob,
  onAddJob,

  showAddForm,
  setShowAddForm,
}: ContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<"date" | "status">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [showSadFace, setShowSadFace] = useState(false);

  // Search functionality
  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const filtered = jobs.filter((job) =>
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
      setShowSadFace(true);
      setTimeout(() => setShowSadFace(false), 3000);
    } else {
      setShowSadFace(false);
    }

    return filtered;
  }, [jobs, searchQuery]);

  // Sort functionality
  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs].sort((a, b) => {
      if (sortColumn === "date") {
        const dateA = new Date(a.appliedDate);
        const dateB = new Date(b.appliedDate);
        return sortDirection === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else {
        return sortDirection === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
    });
    return sorted;
  }, [filteredJobs, sortColumn, sortDirection]);

  // Format date - only show application date
  const formatDate = (date: string) => {
    if (!date) return "";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date; // Return original if invalid
      return dateObj.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return date; // Return original string if parsing fails
    }
  };

  // Handle cell editing
  const handleCellClick = (jobId: string, field: string) => {
    setEditingCell({ id: jobId, field });
  };

  const handleCellEdit = (jobId: string, field: string, value: string) => {
    onUpdateJob(jobId, { [field]: value });
    setEditingCell(null);
  };

  if (viewMode === "todos") {
    return (
      <TodoList
        onApplied={(url, companyName) => {
          // When a todo is marked as applied, add it to Table 1
          onAddJob({
            company: companyName,
            position: "Software Developer",
            status: "APPLIED",
            notes: "",
            appliedDate: new Date().toISOString().split("T")[0],
            url: url,
            tableName: "Table 1",
          });
        }}
      />
    );
  }

  if (viewMode === "table") {
    return (
      <div className="w-full max-w-[1260px] h-auto min-h-[400px] sm:h-[530px] bg-white rounded-[20px] shadow-[0px_24px_80px_-40px_rgba(0,0,0,0.25)] relative overflow-hidden">
        {/* Company Search Bar */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="relative w-full flex items-center">
            {/* Search Icon */}
            <div className="flex-shrink-0 mr-3">
              {showSadFace ? (
                <Frown className="w-4 h-4  text-gray-400" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={
                  filteredJobs.length === 0 && searchQuery
                    ? "No records"
                    : "Looking for anything?"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 px-0 py-1 bg-transparent text-black placeholder-gray-500  focus:outline-none "
              />
            </div>

            {/* Add and Share Icons */}
            <div className="flex-shrink-0 ml-1 flex items-center gap-2">
              <button
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
              <ShareMenu exportOptions={getTableExportOptions(jobs)} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col h-auto sm:h-[calc(100%-61px)]">
          {/* Table Header - Fixed - Responsive grid */}
          <div className="bg-gray-100 border-b border-gray-200 flex-shrink-0 overflow-x-auto">
            <div className="grid grid-cols-[100px_150px_150px_120px_1fr] sm:grid-cols-[120px_180px_180px_150px_1fr] md:grid-cols-[150px_200px_200px_180px_1fr] gap-0 min-w-[700px]">
              <button
                onClick={() => {
                  setSortColumn("date");
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                }}
                className="p-3 font-medium text-gray-700 border-r border-gray-200 text-left hover:bg-gray-200 transition-colors"
              >
                Date{" "}
                {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <div className="p-3 font-medium text-gray-700 border-r border-gray-200">
                Company
              </div>
              <div className="p-3 font-medium text-gray-700 border-r border-gray-200">
                Job
              </div>
              <button
                onClick={() => {
                  setSortColumn("status");
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                }}
                className="p-3 font-medium text-gray-700 border-r border-gray-200 text-left hover:bg-gray-200 transition-colors"
              >
                Status{" "}
                {sortColumn === "status" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <div className="p-3 font-medium text-gray-700">Notes</div>
            </div>
          </div>

          {/* Table Body - Conditional Scrollable */}
          <div
            className={`flex-1 min-h-0 overflow-x-auto ${
              sortedJobs.length > 10 ? "overflow-y-auto" : "overflow-y-hidden"
            }`}
          >
            {/* Add Job Form Row */}
            {showAddForm && (
              <div
                className="grid grid-cols-[100px_150px_150px_120px_1fr] sm:grid-cols-[120px_180px_180px_150px_1fr] md:grid-cols-[150px_200px_200px_180px_1fr] gap-0 border-b border-gray-200 bg-blue-50 p-2 min-w-[700px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const dateEl = document.getElementById(
                      "add-date"
                    ) as HTMLInputElement;
                    const companyEl = document.getElementById(
                      "add-company"
                    ) as HTMLInputElement;
                    const positionEl = document.getElementById(
                      "add-position"
                    ) as HTMLInputElement;
                    const statusEl = document.getElementById(
                      "add-status"
                    ) as HTMLSelectElement;
                    const notesEl = document.getElementById(
                      "add-notes"
                    ) as HTMLInputElement;

                    if (companyEl.value && positionEl.value) {
                      // Capitalize first letter of company name
                      const capitalizeCompany = (name: string) => {
                        return name.charAt(0).toUpperCase() + name.slice(1);
                      };

                      onAddJob({
                        company: capitalizeCompany(companyEl.value),
                        position: positionEl.value,
                        status: statusEl.value as any,
                        notes: notesEl.value,
                        appliedDate: dateEl.value,
                      });
                      setShowAddForm(false);
                    }
                  } else if (e.key === "Escape") {
                    setShowAddForm(false);
                  }
                }}
              >
                {/* Date Input */}
                <div className="p-2 border-r border-gray-100">
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="add-date"
                  />
                </div>

                {/* Company Input */}
                <div className="p-2 border-r border-gray-100">
                  <input
                    type="text"
                    placeholder="Company name"
                    className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="add-company"
                    autoFocus
                  />
                </div>

                {/* Job Input */}
                <div className="p-2 border-r border-gray-100">
                  <input
                    type="text"
                    placeholder="Job title"
                    defaultValue="Software Developer"
                    className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="add-position"
                  />
                </div>

                {/* Status Select */}
                <div className="p-2 border-r border-gray-100">
                  <select
                    defaultValue="APPLIED"
                    className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="add-status"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="INTERVIEWING">Interviewing</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="OFFER">Offer</option>
                  </select>
                </div>

                {/* Notes Input */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Add notes... (Press Enter to save, Esc to cancel)"
                    className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="add-notes"
                  />
                </div>
              </div>
            )}

            {/* Render Jobs */}
            <div className="min-h-full">
              {sortedJobs.map((job, index) => (
                <div
                  key={job.id}
                  className={`grid grid-cols-[100px_150px_150px_120px_1fr] sm:grid-cols-[120px_180px_180px_150px_1fr] md:grid-cols-[150px_200px_200px_180px_1fr] gap-0 border-b border-gray-100 hover:bg-gray-50 transition-colors min-w-[700px] ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {/* Date Field */}
                  <div
                    className={`p-3 border-r border-gray-100 ${
                      editingRow === job.id ? "cursor-pointer" : ""
                    }`}
                    onClick={() =>
                      editingRow === job.id && handleCellClick(job.id, "date")
                    }
                  >
                    {editingRow === job.id &&
                    editingCell?.id === job.id &&
                    editingCell?.field === "date" ? (
                      <input
                        type="date"
                        value={job.appliedDate}
                        onChange={(e) =>
                          handleCellEdit(
                            job.id,
                            "appliedDate",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">
                        {formatDate(job.appliedDate)}
                      </span>
                    )}
                  </div>

                  {/* Company Field */}
                  <div
                    className={`p-3 border-r border-gray-100 ${
                      editingRow === job.id ? "cursor-pointer" : ""
                    }`}
                    onClick={() =>
                      editingRow === job.id &&
                      handleCellClick(job.id, "company")
                    }
                  >
                    {editingRow === job.id &&
                    editingCell?.id === job.id &&
                    editingCell?.field === "company" ? (
                      <input
                        type="text"
                        value={job.company}
                        onChange={(e) =>
                          handleCellEdit(job.id, "company", e.target.value)
                        }
                        className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-800">{job.company}</span>
                    )}
                  </div>

                  {/* Position Field */}
                  <div
                    className={`p-3 border-r border-gray-100 ${
                      editingRow === job.id ? "cursor-pointer" : ""
                    }`}
                    onClick={() =>
                      editingRow === job.id &&
                      handleCellClick(job.id, "position")
                    }
                  >
                    {editingRow === job.id &&
                    editingCell?.id === job.id &&
                    editingCell?.field === "position" ? (
                      <input
                        type="text"
                        value={job.position}
                        onChange={(e) =>
                          handleCellEdit(job.id, "position", e.target.value)
                        }
                        className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-800">{job.position}</span>
                    )}
                  </div>

                  {/* Status Field - Custom dropdown */}
                  <div className="p-3 border-r border-gray-100 relative">
                    {editingCell?.id === job.id &&
                    editingCell?.field === "status" ? (
                      <div className="relative">
                        {/* Custom Status Dropdown */}
                        <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {[
                            {
                              value: "APPLIED",
                              label: "Applied",
                              color: "bg-blue-100 text-blue-800",
                            },
                            {
                              value: "INTERVIEWING",
                              label: "Interviewing",
                              color: "bg-yellow-100 text-yellow-800",
                            },
                            {
                              value: "REJECTED",
                              label: "Rejected",
                              color: "bg-red-100 text-red-800",
                            },
                            {
                              value: "OFFER",
                              label: "Offer",
                              color: "bg-green-100 text-green-800",
                            },
                          ].map((status) => (
                            <div
                              key={status.value}
                              onClick={() => {
                                handleCellEdit(job.id, "status", status.value);
                                setEditingCell(null);
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center ${
                                job.status === status.value ? "bg-gray-50" : ""
                              }`}
                            >
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Backdrop to close dropdown */}
                        <div
                          className="fixed inset-0 z-5"
                          onClick={() => setEditingCell(null)}
                        />
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => handleCellClick(job.id, "status")}
                      >
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                            job.status === "APPLIED"
                              ? "bg-blue-100 text-blue-800"
                              : job.status === "INTERVIEWING"
                              ? "bg-yellow-100 text-yellow-800"
                              : job.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800" // OFFER
                          }`}
                        >
                          {job.status === "APPLIED" ? "Applied" :
                           job.status === "INTERVIEWING" ? "Interviewing" :
                           job.status === "REJECTED" ? "Rejected" : "Offer"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes Field with Action Buttons - Clean edit style */}
                  <div className="p-3 flex items-center gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleCellClick(job.id, "notes")}
                    >
                      {editingCell?.id === job.id &&
                      editingCell?.field === "notes" ? (
                        <input
                          type="text"
                          value={job.notes || ""}
                          onChange={(e) =>
                            handleCellEdit(job.id, "notes", e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          className="w-full px-0 py-1 bg-transparent text-gray-800 text-sm border-0 border-b border-gray-300 focus:outline-none focus:border-gray-500 focus:ring-0"
                          placeholder="Add notes..."
                          autoFocus
                        />
                      ) : (
                        <span className="text-gray-600 text-sm hover:text-gray-800 transition-colors border-b border-transparent hover:border-gray-200 py-1">
                          {job.notes || "Add notes..."}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <button
                      onClick={() => onDeleteJob(job.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-light leading-none"
                      title="Delete"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty state when no jobs */}
              {sortedJobs.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[300px]">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <p className="text-lg font-medium">
                      No job applications found
                    </p>
                    <p className="text-sm">
                      Try searching for a different company
                    </p>
                  </div>
                </div>
              )}

              {/* Add empty rows to fill space only when not scrolling */}
              {sortedJobs.length <= 10 &&
                Array.from({
                  length: Math.max(10 - sortedJobs.length, 0),
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className={`grid grid-cols-[100px_150px_150px_120px_1fr] sm:grid-cols-[120px_180px_180px_150px_1fr] md:grid-cols-[150px_200px_200px_180px_1fr] gap-0 border-b border-gray-100 h-12 min-w-[700px] ${
                      (sortedJobs.length + index) % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3"></div>
                  </div>
                ))}

              {/* Add extra scrollable content when there are many jobs */}
              {sortedJobs.length > 10 &&
                Array.from({
                  length: 5,
                }).map((_, index) => (
                  <div
                    key={`extra-${index}`}
                    className={`grid grid-cols-[100px_150px_150px_120px_1fr] sm:grid-cols-[120px_180px_180px_150px_1fr] md:grid-cols-[150px_200px_200px_180px_1fr] gap-0 border-b border-gray-100 h-12 min-w-[700px] ${
                      (sortedJobs.length + index) % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3"></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1260px] h-auto min-h-[400px] sm:h-[530px] bg-white rounded-[20px] shadow-[0px_24px_80px_-40px_rgba(0,0,0,0.25)] overflow-hidden">
      {stats && <JobStatsComponent stats={stats} jobs={jobs} />}
    </div>
  );
}
