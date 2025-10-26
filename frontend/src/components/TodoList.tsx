import { useState, useEffect } from "react";
import { authClient } from "../lib/auth.client";
import { Square } from "lucide-react";

interface TodoJob {
  id: string;
  url: string;
  applied: boolean;
  createdAt: string;
}

interface TodoListProps {
  onApplied: (url: string, companyName: string) => void;
}

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// LocalStorage key
const TODOS_STORAGE_KEY = "job_tracker_todos";

export function TodoList({ onApplied }: TodoListProps) {
  const [todos, setTodos] = useState<TodoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginAndFetchTodos();
  }, []);

  const checkLoginAndFetchTodos = async () => {
    try {
      setLoading(true);
      const session = await authClient.getSession();
      const token = session?.data?.session?.token;

      if (token) {
        setIsLoggedIn(true);
        await fetchTodosFromAPI(token);
      } else {
        setIsLoggedIn(false);
        loadTodosFromLocalStorage();
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setIsLoggedIn(false);
      loadTodosFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const fetchTodosFromAPI = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      const formattedTodos = (data.data || []).map((todo: any) => ({
        id: todo.id,
        url: todo.url,
        applied: todo.completed,
        createdAt: todo.createdAt,
      }));
      setTodos(formattedTodos);
    } catch (error) {
      console.error("Error fetching todos from API:", error);
      loadTodosFromLocalStorage();
    }
  };

  const loadTodosFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(TODOS_STORAGE_KEY);
      if (stored) {
        setTodos(JSON.parse(stored));
      } else {
        // Mock data for demonstration
        const mockTodos: TodoJob[] = [
          {
            id: "mock-1",
            url: "https://www.linkedin.com/jobs/view/1234567890",
            applied: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "mock-2",
            url: "https://www.seek.com.au/job/12345678",
            applied: false,
            createdAt: new Date().toISOString(),
          },
        ];
        setTodos(mockTodos);
        localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(mockTodos));
      }
    } catch (error) {
      console.error("Error loading todos from localStorage:", error);
      setTodos([]);
    }
  };

  const saveTodosToLocalStorage = (updatedTodos: TodoJob[]) => {
    try {
      localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(updatedTodos));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Extract company name from URL
  const extractCompanyFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Extract from different job sites
      if (hostname.includes('linkedin.com')) {
        return 'LinkedIn';
      } else if (hostname.includes('seek.com')) {
        return 'Seek';
      } else if (hostname.includes('indeed.com')) {
        return 'Indeed';
      } else if (hostname.includes('glassdoor.com')) {
        return 'Glassdoor';
      } else {
        // Try to get company name from domain
        const domain = hostname.replace('www.', '').split('.')[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    } catch (error) {
      return 'Unknown Company';
    }
  };

  const handleToggleApplied = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const companyName = extractCompanyFromUrl(todo.url);

    if (isLoggedIn) {
      try {
        const session = await authClient.getSession();
        const token = session?.data?.session?.token;

        if (!token) return;

        const response = await fetch(
          `${API_URL}/api/todos/${id}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tableId: "table1" }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to complete todo");
        }

        // Remove from list
        const updatedTodos = todos.filter((t) => t.id !== id);
        setTodos(updatedTodos);

        // Call parent to add job application with extracted company name
        onApplied(todo.url, companyName);
      } catch (error) {
        console.error("Error completing todo:", error);
        alert("Failed to mark as applied.");
      }
    } else {
      // Remove from local storage immediately
      const updatedTodos = todos.filter((t) => t.id !== id);
      setTodos(updatedTodos);
      saveTodosToLocalStorage(updatedTodos);

      // Call parent to add job application
      onApplied(todo.url, companyName);
    }
  };


  // Expose addTodo method
  useEffect(() => {
    (window as any).__addTodoToList = (url: string) => {
      const newTodo: TodoJob = {
        id: `todo-${Date.now()}`,
        url,
        applied: false,
        createdAt: new Date().toISOString(),
      };

      const updatedTodos = [newTodo, ...todos];
      setTodos(updatedTodos);

      if (!isLoggedIn) {
        saveTodosToLocalStorage(updatedTodos);
      }
    };
    return () => {
      delete (window as any).__addTodoToList;
    };
  }, [todos, isLoggedIn]);

  return (
    <div className="w-full max-w-[1260px] h-auto min-h-[400px] sm:h-[530px] bg-white rounded-[20px] shadow-[0px_24px_80px_-40px_rgba(0,0,0,0.25)] relative overflow-hidden">
      {/* Table Container */}
      <div className="flex flex-col h-full">
        {/* Table Header */}
        <div className="bg-gray-100 border-b border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-[1fr_150px] gap-0">
            <div className="p-3 font-medium text-gray-700 border-r border-gray-200">
              JOB URL
            </div>
            <div className="p-3 font-medium text-gray-700 text-center">
              APPLIED
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No job URLs saved yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Paste a URL above and click "Add Todo" to get started
                </p>
              </div>
            </div>
          ) : (
            <div>
              {todos.map((todo, index) => (
                <div
                  key={todo.id}
                  className={`grid grid-cols-[1fr_150px] gap-0 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div className="p-3 border-r border-gray-100">
                    <a
                      href={todo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
                    >
                      {todo.url}
                    </a>
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    <button
                      onClick={() => handleToggleApplied(todo.id)}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <Square className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Fill empty rows to maintain consistent height */}
              {todos.length <= 10 &&
                Array.from({
                  length: Math.max(10 - todos.length, 0),
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className={`grid grid-cols-[1fr_150px] gap-0 border-b border-gray-100 h-12 ${
                      (todos.length + index) % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <div className="p-3 border-r border-gray-100"></div>
                    <div className="p-3"></div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
