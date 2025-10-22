import { useState, useRef, useEffect } from "react";
import { Share2, ChevronDown } from "lucide-react";
import { ExportOption } from "../utils/exportUtils";

interface ShareMenuProps {
  exportOptions: ExportOption[];
  className?: string;
}

export function ShareMenu({ exportOptions, className = "" }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: ExportOption) => {
    if (!option.disabled) {
      option.action();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
        title="Share/Export"
      >
        <Share2 className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-0.5">
          {exportOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                option.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <span className="text-sm">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
