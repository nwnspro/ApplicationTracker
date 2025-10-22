import { Button } from "./ui/button";
import { Plus, Download } from "lucide-react";

interface ControlsProps {
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  onExport: () => void;
}

export function Controls({ setShowAddForm, onExport }: ControlsProps) {
  return (
    <>
      {/* Content inside the sheet */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full h-10 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            ADD
          </Button>
          <Button
            variant="outline"
            onClick={onExport}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </>
  );
}
