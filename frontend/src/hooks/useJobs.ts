import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "../services/jobService";
import { Job } from "../types/job";

// Mock data for when user is not logged in - NZ Zoo themed!
const mockJobs: Job[] = [
  {
    id: "mock-1",
    company: "Auckland Zoo",
    position: "Senior Elephant",
    status: "APPLIED",
    notes: "Elephants can recognize themselves in mirrors - one of few animals with self-awareness!",
    appliedDate: "2025-10-20",
    updatedAt: "2025-10-20",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-2",
    company: "Wellington Zoo",
    position: "Intermediate Kiwi",
    status: "APPLIED",
    notes: "Kiwi birds are flightless and have nostrils at the end of their beaks!",
    appliedDate: "2025-10-18",
    updatedAt: "2025-10-18",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-3",
    company: "Orana Wildlife Park",
    position: "Junior Kea",
    status: "INTERVIEWING",
    notes: "Keas are the world's only alpine parrot and are incredibly intelligent!",
    appliedDate: "2025-10-15",
    updatedAt: "2025-10-20",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-4",
    company: "Hamilton Zoo",
    position: "Senior Hippo",
    status: "INTERVIEWING",
    notes: "Hippos can hold their breath underwater for up to 5 minutes!",
    appliedDate: "2025-10-12",
    updatedAt: "2025-10-21",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-5",
    company: "Zealandia",
    position: "Intermediate Tūī",
    status: "REJECTED",
    notes: "Tūī have two voice boxes and can sing complex melodies!",
    appliedDate: "2025-10-01",
    updatedAt: "2025-10-10",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-6",
    company: "Rotorua Paradise Valley",
    position: "Principal Lion",
    status: "OFFER",
    notes: "Lions are the only cats that live in groups called prides!",
    appliedDate: "2025-09-25",
    updatedAt: "2025-10-19",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-7",
    company: "Christchurch Willowbank",
    position: "Junior Kākāpō",
    status: "APPLIED",
    notes: "Kākāpō are the world's heaviest parrots and smell like honey!",
    appliedDate: "2025-10-22",
    updatedAt: "2025-10-22",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-8",
    company: "National Aquarium NZ",
    position: "Senior Little Blue Penguin",
    status: "INTERVIEWING",
    notes: "Little Blue Penguins are the smallest penguin species and native to NZ!",
    appliedDate: "2025-10-21",
    updatedAt: "2025-10-21",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-9",
    company: "Pukaha Mount Bruce",
    position: "Intermediate Takahē",
    status: "APPLIED",
    notes: "Takahē were thought extinct until rediscovered in 1948!",
    appliedDate: "2025-10-19",
    updatedAt: "2025-10-19",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-10",
    company: "Butterfly Creek",
    position: "Junior Butterfly",
    status: "APPLIED",
    notes: "Butterflies taste with their feet!",
    appliedDate: "2025-10-17",
    updatedAt: "2025-10-17",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-11",
    company: "Kiwi Birdlife Park",
    position: "Senior Kiwi",
    status: "OFFER",
    notes: "Kiwi lay one of the largest eggs relative to body size of any bird!",
    appliedDate: "2025-10-14",
    updatedAt: "2025-10-16",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-12",
    company: "Rainbow Springs",
    position: "Intermediate Tuatara",
    status: "INTERVIEWING",
    notes: "Tuataras are living fossils that have barely changed in 200 million years!",
    appliedDate: "2025-10-11",
    updatedAt: "2025-10-13",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-13",
    company: "Auckland Zoo",
    position: "Junior Red Panda",
    status: "REJECTED",
    notes: "Red pandas use their fluffy tails as blankets in cold weather!",
    appliedDate: "2025-10-08",
    updatedAt: "2025-10-09",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-14",
    company: "Wellington Zoo",
    position: "Principal Kākā",
    status: "APPLIED",
    notes: "Kākās are forest parrots known for their acrobatic flying!",
    appliedDate: "2025-10-05",
    updatedAt: "2025-10-05",
    userId: "mock-user",
    tableName: "Table 1",
  },
  {
    id: "mock-15",
    company: "Te Puia",
    position: "Senior Pīwakawaka",
    status: "INTERVIEWING",
    notes: "Fantails (Pīwakawaka) are super friendly and often follow hikers!",
    appliedDate: "2025-10-03",
    updatedAt: "2025-10-04",
    userId: "mock-user",
    tableName: "Table 1",
  },
];

export function useJobs(currentTable: string = "Table 1") {
  const queryClient = useQueryClient();
  const [localMockJobs, setLocalMockJobs] = useState<Job[]>(mockJobs);

  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ["jobs"],
    queryFn: jobService.getJobs,
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["jobStats"],
    queryFn: jobService.getJobStats,
    retry: false,
  });

  // Use mock data ONLY if user is not authenticated (guest mode)
  // Check if error message is 'UNAUTHENTICATED' to determine guest status
  const isGuest = jobsError?.message === 'UNAUTHENTICATED';
  const allJobs = isGuest ? localMockJobs : jobs;
  const displayJobs = allJobs.filter(job => (job.tableName || "Table 1") === currentTable);
  const isUsingMockData = isGuest;

  const addJobMutation = useMutation({
    mutationFn: jobService.addJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobStats"] });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Job> }) =>
      jobService.updateJob(id, updates),
    // Optimistically update the UI before the API call completes
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData(["jobs"]);

      // Optimistically update the job
      queryClient.setQueryData(["jobs"], (old: Job[] | undefined) => {
        if (!old) return [];
        return old.map((job) =>
          job.id === id ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
        );
      });

      return { previousJobs };
    },
    // If mutation fails, rollback
    onError: (err, variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobStats"] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: jobService.deleteJob,
    // Optimistically update the UI before the API call completes
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData(["jobs"]);

      // Optimistically update to remove the deleted job
      queryClient.setQueryData(["jobs"], (old: Job[] | undefined) => {
        if (!old) return [];
        return old.filter((job) => job.id !== deletedId);
      });

      // Return context with the snapshot
      return { previousJobs };
    },
    // If mutation fails, rollback to the previous value
    onError: (err, deletedId, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobStats"] });
    },
  });

  // Calculate mock stats from mock jobs if user is a guest
  const displayStats = useMemo(() => {
    if (isGuest || !stats) {
      return {
        total: displayJobs.length,
        applied: displayJobs.length, // Total applications, not just "APPLIED" status
        interviewing: displayJobs.filter(j => j.status === "INTERVIEWING").length,
        rejected: displayJobs.filter(j => j.status === "REJECTED").length,
        offer: displayJobs.filter(j => j.status === "OFFER").length,
      };
    }
    return {
      ...stats,
      applied: displayJobs.length, // Override to show total count
    };
  }, [isGuest, stats, displayJobs]);

  // Mock handlers for when user is not logged in
  const handleMockAdd = (jobData: Omit<Job, "id" | "userId" | "updatedAt">) => {
    const newJob: Job = {
      ...jobData,
      id: `mock-${Date.now()}`,
      userId: "mock-user",
      updatedAt: new Date().toISOString(),
      tableName: currentTable,
    };
    setLocalMockJobs([...localMockJobs, newJob]);
  };

  const handleMockUpdate = ({ id, updates }: { id: string; updates: Partial<Job> }) => {
    setLocalMockJobs(localMockJobs.map(job =>
      job.id === id ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
    ));
  };

  const handleMockDelete = (id: string) => {
    setLocalMockJobs(localMockJobs.filter(job => job.id !== id));
  };

  return {
    jobs: displayJobs,
    stats: displayStats,
    jobsLoading,
    statsLoading,
    addJob: isUsingMockData ? handleMockAdd : addJobMutation.mutate,
    updateJob: isUsingMockData ? handleMockUpdate : updateJobMutation.mutate,
    deleteJob: isUsingMockData ? handleMockDelete : deleteJobMutation.mutate,
    isAdding: addJobMutation.isPending,
    isUpdating: updateJobMutation.isPending,
    isDeleting: deleteJobMutation.isPending,
  };
}
