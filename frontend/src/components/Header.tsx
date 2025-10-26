import {
  User as UserIcon,
  BookText,
  BarChart3,
  LogOut,
  CheckSquare,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useState, useEffect, useRef } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onAddTodo: () => void;
  onTodoListClick: () => void;
  viewMode: "table" | "stats" | "todos";
  setViewMode: (mode: "table" | "stats" | "todos") => void;
  currentTable: string;
  setCurrentTable: (table: string) => void;
  tables: string[];
  setTables: (tables: string[]) => void;
}

export function Header({
  inputValue,
  setInputValue,
  onAddTodo,
  onTodoListClick,
  viewMode,
  setViewMode,
  currentTable,
  setCurrentTable,
  tables,
  setTables,
}: HeaderProps) {
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setImageError(false); // Reset image error on user change
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTableDropdown(false);
      }
    }

    if (showTableDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showTableDropdown]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error("Failed to get session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="relative">
      {/* User Login/Profile - Top Right */}
      <div className="absolute top-0 right-2 z-50">
        {loading ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full animate-pulse"></div>
        ) : user ? (
          <div className="relative group">
            <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white hover:border-gray-300 transition-all duration-200">
              {(() => {
                const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
                return avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={user.user_metadata?.full_name || user.email || "User"}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                );
              })()}
            </button>
            {/* Dropdown Menu */}
            <div className="absolute top-12 sm:top-14 right-0 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
              <div className="p-3 border-b">
                <p className="text-sm font-medium text-gray-900 truncate">{user.user_metadata?.full_name || user.email}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-10 h-10 sm:w-12 sm:h-12 relative bg-gray-700 rounded-[100px] overflow-hidden flex items-center justify-center hover:bg-gray-600 transition-all duration-200"
          >
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        )}
      </div>

      {/* Left-aligned Title */}
      <div className="text-left mb-4 sm:mb-6 md:mb-8 px-2">
        <h1 className="max-w-full sm:max-w-[831px] text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight font-['Onest'] italic mb-4 sm:mb-6 md:mb-8">
          Simple but cool application tracker 🐘
        </h1>
      </div>

      {/* Input and Auto Fill Section */}
      <div className="flex justify-start mb-4 sm:mb-6 md:mb-8 px-2 pr-0">
        <div className="w-full max-w-[calc(100%-280px)] sm:max-w-[calc(100%-260px)] md:max-w-[923px] h-12 px-2 py-3 bg-white/60 rounded-full outline outline-1 outline-offset-[-0.50px] outline-gray-200 inline-flex justify-start items-center gap-0">
          <input
            type="text"
            placeholder="Paste URL here"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 h-full bg-transparent text-black placeholder-gray-500 focus:outline-none border-none px-2 text-sm sm:text-base"
          />
          <button
            onClick={onAddTodo}
            className="flex-shrink-0 h-9 px-3 sm:px-5 py-2 sm:py-4 bg-gray-700 rounded-[109px] inline-flex justify-center items-center gap-1 hover:bg-gray-900 transition-all duration-200"
          >
            <div className="text-white text-sm sm:text-base font-normal font-['Onest'] leading-snug whitespace-nowrap">
              Add Todo
            </div>
          </button>
        </div>
      </div>

      {/* View Toggle Buttons - Right side below avatar */}
      <div className="absolute top-16 sm:top-20 md:top-24 right-2 sm:right-4 z-20 flex items-center gap-1 sm:gap-3 md:gap-5">
        {/* Todo List Icon */}
        <button
          onClick={onTodoListClick}
          className={`w-6 h-6 sm:w-7 sm:h-7 relative overflow-hidden flex items-center justify-center ${
            viewMode === "todos" ? "bg-gray-200" : "bg-transparent"
          } rounded-md hover:bg-gray-100 transition-all duration-200`}
          title="Todo List"
        >
          <CheckSquare className="w-4 h-4 text-black" />
        </button>

        {/* Table Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowTableDropdown(!showTableDropdown);
              setViewMode("table");
            }}
            className="text-black text-xs sm:text-sm md:text-base font-normal font-['Onest'] hover:text-gray-600 transition-colors flex items-center gap-0.5 sm:gap-1"
          >
            {currentTable}
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showTableDropdown && (
            <div className="absolute top-8 right-0 w-48 bg-white rounded-lg shadow-lg border z-50">
              <div className="py-1">
                {tables.map((table) => (
                  <div key={table} className="flex items-center group">
                    <button
                      onClick={() => {
                        setCurrentTable(table);
                        setViewMode("table");
                        setShowTableDropdown(false);
                      }}
                      className={`flex-1 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        currentTable === table ? "bg-gray-50 font-medium" : ""
                      }`}
                    >
                      {table}
                    </button>
                    {tables.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${table}?`)) {
                            const newTables = tables.filter((t) => t !== table);
                            setTables(newTables);
                            if (currentTable === table) {
                              setCurrentTable(newTables[0]);
                            }
                          }
                        }}
                        className="px-2 py-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <button
                    onClick={() => {
                      const newTableNum = tables.length + 1;
                      const newTable = `Table ${newTableNum}`;
                      setTables([...tables, newTable]);
                      setCurrentTable(newTable);
                      setViewMode("table");
                      setShowTableDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    + Add New Table
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Icon */}
        <button
          onClick={() => setViewMode("table")}
          className={`w-6 h-6 sm:w-7 sm:h-7 relative overflow-hidden flex items-center justify-center ${
            viewMode === "table" ? "bg-gray-200" : "bg-transparent"
          } rounded-md hover:bg-gray-100 transition-all duration-200`}
        >
          <BookText className="w-4 h-4 text-black" />
        </button>

        {/* Stats Icon */}
        <button
          onClick={() => setViewMode("stats")}
          className={`w-6 h-6 sm:w-7 sm:h-7 relative overflow-hidden flex items-center justify-center ${
            viewMode === "stats" ? "bg-gray-200" : "bg-transparent"
          } rounded-md hover:bg-gray-100 transition-all duration-200`}
        >
          <BarChart3 className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}
