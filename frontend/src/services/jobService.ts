import { Job, JobStats } from "../types/job";
import { supabase } from "../lib/supabase";

const API_BASE_URL = "http://localhost:3001/api";

// Helper function to make authenticated API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get the current session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // If no token, throw an authentication error
  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Add Supabase token
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const jobService = {
  async getJobs(): Promise<Job[]> {
    const result = await apiRequest<{jobApplications: Job[]}>('/applications');
    return result.jobApplications || [];
  },

  async addJob(jobData: Omit<Job, "id" | "userId" | "updatedAt">): Promise<Job> {
    return await apiRequest<Job>('/applications', {
      method: 'POST',
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
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteJob(id: string): Promise<void> {
    await apiRequest(`/applications/${id}`, {
      method: 'DELETE',
    });
  },

  async getJobStats(): Promise<JobStats> {
    const jobs = await this.getJobs();
    const total = jobs.length;
    const applied = jobs.filter((job) => job.status === "APPLIED").length;
    const rejected = jobs.filter((job) => job.status === "REJECTED").length;
    const offer = jobs.filter((job) => job.status === "OFFER").length;
    const interviewing = jobs.filter((job) => job.status === "INTERVIEWING").length;

    return { total, applied, interviewing, rejected, offer };
  },
};
