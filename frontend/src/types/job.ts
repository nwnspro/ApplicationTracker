export const JOB_STATUS_VALUES = [
  "APPLIED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "INTERVIEWING",
  "OFFER",
  "OFFER_RECEIVED",
  "REJECTED",
  "WITHDRAWN",
  "NO_RESPONSE",
] as const;

export type JobStatus = (typeof JOB_STATUS_VALUES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  APPLIED: "Applied",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Completed",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  OFFER_RECEIVED: "Offer Received",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  NO_RESPONSE: "No Response",
};

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
}

export type NewJobInput = Omit<Job, "id" | "userId" | "updatedAt">;

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
