import { Job, JobStats } from "../types/job";
import { supabase } from "../lib/supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Cached token to avoid calling getSession() on every request
let cachedToken: string | null = null;
let tokenExpiry = 0;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? null;
  tokenExpiry = session ? (session.expires_at ?? 0) * 1000 : 0;
});

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 30_000) {
    return cachedToken;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  cachedToken = session?.access_token ?? null;
  tokenExpiry = session ? (session.expires_at ?? 0) * 1000 : 0;
  if (!cachedToken) throw new Error("UNAUTHENTICATED");
  return cachedToken;
}

// Helper function to make authenticated API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getToken();

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Add Supabase token
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const jobService = {
  async getJobs(
    page = 1,
    pageSize = 50,
  ): Promise<{
    jobApplications: Job[];
    pagination: { page: number; totalPages: number };
  }> {
    return await apiRequest<{
      jobApplications: Job[];
      pagination: { page: number; totalPages: number };
    }>(`/applications?page=${page}&pageSize=${pageSize}`);
  },

  async addJob(
    jobData: Omit<Job, "id" | "userId" | "updatedAt">,
  ): Promise<Job> {
    return await apiRequest<Job>("/applications", {
      method: "POST",
      body: JSON.stringify({
        company: jobData.company,
        position: jobData.position,
        status: jobData.status,
        notes: jobData.notes || null,
        url: jobData.url || null,
        appliedDate: jobData.appliedDate,
      }),
    });
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    return await apiRequest<Job>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteJob(id: string): Promise<void> {
    await apiRequest<void>(`/applications/${id}`, {
      method: "DELETE",
    });
  },

  calculateStats(jobs: Job[]): JobStats {
    const total = jobs.length;
    const interviewStatuses = new Set([
      "INTERVIEWING",
      "INTERVIEW_SCHEDULED",
      "INTERVIEW_COMPLETED",
    ]);
    const interviewed = jobs.filter(
      (job) =>
        interviewStatuses.has(job.status) ||
        job.statusHistory?.some((entry) => interviewStatuses.has(entry.status)),
    );
    const rejected = jobs.filter((job) => job.status === "REJECTED").length;
    const rejectedAfterInterview = jobs.filter(
      (job) =>
        job.status === "REJECTED" &&
        interviewed.some((interviewedJob) => interviewedJob.id === job.id),
    ).length;
    const rejectedWithoutInterview = rejected - rejectedAfterInterview;
    const noResponse = jobs.filter(
      (job) =>
        job.status !== "REJECTED" &&
        !interviewed.some((interviewedJob) => interviewedJob.id === job.id),
    ).length;

    return {
      total,
      applied: total,
      interviewing: interviewed.length,
      rejected,
      noResponse,
      rejectedAfterInterview,
      rejectedWithoutInterview,
    };
  },

  async getJobStats(tableName = "Table 1"): Promise<JobStats> {
    return await apiRequest<JobStats>(
      `/applications/stats?tableName=${encodeURIComponent(tableName)}`,
    );
  },
};
