export const JOB_STATUS_VALUES = [
  "APPLIED",
  "INTERVIEWING",
  "REJECTED",
] as const;

export type JobStatus = (typeof JOB_STATUS_VALUES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
};

export interface StatusHistoryEntry {
  id?: string;
  jobId?: string;
  status: JobStatus;
  changedAt: string;
}

export interface Job {
  id: string;
  company: string;
  position: string;
  status: JobStatus;
  notes: string | null;
  appliedDate: string;
  updatedAt: string;
  userId: string;
  url?: string | null;
  tableName?: string;
  statusHistory?: StatusHistoryEntry[];
}

export type NewJobInput = Omit<Job, "id" | "userId" | "updatedAt">;

export interface JobFilters {
  status?: JobStatus;
  company?: string;
  search?: string;
}

export interface JobStats {
  applications: Array<{
    status: JobStatus;
    statusHistory: Array<{ status: JobStatus }>;
  }>;
  total: number;
  applied: number;
  interviewing: number;
  rejected: number;
  noResponse: number;
  rejectedAfterInterview: number;
  rejectedWithoutInterview: number;
}
