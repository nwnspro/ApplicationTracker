import { useState } from "react";
import { Job } from "./types/job";
import { useJobs } from "./hooks/useJobs";
import { exportToCSV } from "./utils/exportUtils";
import { Header } from "./components/Header";
import { Content } from "./components/Content";
import { authClient } from "./lib/auth.client";

function App() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "stats" | "todos">(
    "table"
  );
  const [inputValue, setInputValue] = useState("");
  const [currentTable, setCurrentTable] = useState("Table 1");
  const [tables, setTables] = useState(["Table 1"]);
  const [todoRefreshKey, setTodoRefreshKey] = useState(0);

  const {
    jobs,
    stats,
    jobsLoading,
    statsLoading,
    addJob,
    updateJob,
    deleteJob,
  } = useJobs(currentTable);

  const handleAddJob = (jobData: Omit<Job, "id" | "lastUpdated">) => {
    // Ensure the job is added to the correct table
    const jobWithTable = {
      ...jobData,
      tableName: jobData.tableName || currentTable,
    };
    addJob(jobWithTable);
    setShowAddForm(false);
  };

  const handleUpdateJob = (id: string, updates: Partial<Job>) => {
    updateJob({ id, updates });
  };

  const handleDeleteJob = (id: string) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      // Check if table will be empty after deletion (before actually deleting)
      const remainingJobs = jobs.filter(
        (job) =>
          (job.tableName || "Table 1") === currentTable && job.id !== id
      );

      // Auto-delete empty tables if there are multiple tables
      if (remainingJobs.length === 0 && tables.length > 1) {
        const newTables = tables.filter((t) => t !== currentTable);
        setTables(newTables);
        setCurrentTable(newTables[0]);
      }

      // Delete the job (will update UI optimistically)
      deleteJob(id);
    }
  };

  const handleAddTodo = async () => {
    if (!inputValue.trim()) {
      alert("Please enter a URL");
      return;
    }

    const TODOS_STORAGE_KEY = "job_tracker_todos";

    try {
      const session = await authClient.getSession();
      const token = session?.data?.session?.token;

      // Add to localStorage immediately (for offline or immediate display)
      const newTodo = {
        id: `todo-${Date.now()}`,
        url: inputValue,
        applied: false,
        createdAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem(TODOS_STORAGE_KEY);
      const existingTodos = stored ? JSON.parse(stored) : [];
      const updatedTodos = [newTodo, ...existingTodos];
      localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(updatedTodos));

      if (token) {
        // If logged in, also add to API
        const response = await fetch("http://localhost:3001/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: inputValue }),
        });

        if (!response.ok) {
          throw new Error("Failed to add todo");
        }
      }

      // Trigger refresh of todo list
      setTodoRefreshKey((prev) => prev + 1);

      // Switch to todos view and clear input
      setViewMode("todos");
      setInputValue("");
    } catch (error) {
      console.error("Error adding todo:", error);
      alert(
        "Failed to add URL to todo list. Please check if the URL is valid."
      );
    }
  };

  const handleTodoListClick = () => {
    setViewMode(viewMode === "todos" ? "table" : "todos");
  };

  const exportData = () => {
    exportToCSV(jobs);
  };

  return (
    <div className="min-h-screen bg-[#f9f3e8]">
      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Header
          inputValue={inputValue}
          setInputValue={setInputValue}
          onAddTodo={handleAddTodo}
          onTodoListClick={handleTodoListClick}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentTable={currentTable}
          setCurrentTable={setCurrentTable}
          tables={tables}
          setTables={setTables}
        />

        {/* Main Content Area */}
        <Content
          key={viewMode === "todos" ? `todos-${todoRefreshKey}` : viewMode}
          viewMode={viewMode}
          jobs={jobs}
          stats={stats}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onAddJob={handleAddJob}
          onExport={exportData}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
        />
      </main>
    </div>
  );
}

export default App;
