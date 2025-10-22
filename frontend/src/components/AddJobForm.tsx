import React, { useState } from "react";
import { Job, JobStatus } from "../types/job";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";

interface AddJobFormProps {
  onAddJob: (job: Omit<Job, "id" | "lastUpdated">) => void;
  onCancel: () => void;
}

const statusOptions: JobStatus[] = [
  "APPLIED",
  "INTERVIEWING", 
  "OFFER",
  "REJECTED",
];

export function AddJobForm({ onAddJob, onCancel }: AddJobFormProps) {
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "APPLIED" as JobStatus,
    notes: "",
    appliedDate: new Date().toISOString().split("T")[0],
    url: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddJob({
      ...formData,
      userId: "", // Will be set by the API
      updatedAt: new Date().toISOString(),
    });
    setFormData({
      company: "",
      position: "",
      status: "APPLIED",
      notes: "",
      appliedDate: new Date().toISOString().split("T")[0],
      url: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 border rounded-lg bg-background"
    >
      <h3 className="text-lg font-semibold">Add New Job</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company *</label>
          <Input
            required
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Position *</label>
          <Input
            required
            value={formData.position}
            onChange={(e) => handleChange("position", e.target.value)}
            placeholder="Enter job title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <Select
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Applied Date</label>
          <Input
            type="date"
            value={formData.appliedDate}
            onChange={(e) => handleChange("appliedDate", e.target.value)}
          />
        </div>



        <div>
          <label className="block text-sm font-medium mb-2">Job URL</label>
          <Input
            type="url"
            value={formData.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://company.com/careers/job"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Any additional notes about this application"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Job</Button>
      </div>
    </form>
  );
}
