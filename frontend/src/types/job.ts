export interface Job {
  id: string;
  company: string;
  position: string;
  status: JobStatus;
  notes: string | null;
  appliedDate: string;
  updatedAt: string;
  userId: string;
  tableName?: string; // Optional field for table organization
}

export type JobStatus =
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED";

export interface JobFilters {
  status?: JobStatus;
  company?: string;
  search?: string;
}

export interface JobStats {
  total: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
}
