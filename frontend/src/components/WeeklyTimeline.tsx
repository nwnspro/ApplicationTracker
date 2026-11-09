import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Job, JOB_STATUS_LABELS, JobStatus } from "../types/job";

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface TimelineStep {
  status: JobStatus;
  date: Date;
}

interface WeekNavProps {
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

export function WeekNav({ weekOffset, onWeekOffsetChange }: WeekNavProps) {
  const today = new Date();
  const ref = new Date(today);
  ref.setDate(ref.getDate() + weekOffset * 7);
  const { start, end } = getWeekBounds(ref);
  const isCurrentWeek = weekOffset === 0;
  const weekLabel = `${formatShortDate(start)} – ${formatShortDate(end)}`;

  return (
    <div className="flex items-center ml-3">
      <button
        onClick={() => onWeekOffsetChange(weekOffset - 1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
      </button>
      <span className="text-sm mx-1.5">
        <span className="font-semibold text-gray-800">{isCurrentWeek ? "This week" : "Week"}</span>
        <span className="text-gray-500 ml-1">{weekLabel}</span>
      </span>
      <button
        onClick={() => onWeekOffsetChange(weekOffset + 1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  );
}

interface WeeklyTimelineProps {
  jobs: Job[];
  weekOffset: number;
}

export function WeeklyTimeline({ jobs, weekOffset }: WeeklyTimelineProps) {
  const today = new Date();

  const { start: weekStart, end: weekEnd } = useMemo(() => {
    const ref = new Date(today);
    ref.setDate(ref.getDate() + weekOffset * 7);
    return getWeekBounds(ref);
  }, [weekOffset]);

  // Jobs whose appliedDate falls within the selected week
  const weekJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Extract YYYY-MM-DD and parse as local time to avoid UTC offset issues
      const dateStr = job.appliedDate.split("T")[0];
      const [y, m, d] = dateStr.split("-").map(Number);
      const applied = new Date(y, m - 1, d);
      return applied >= weekStart && applied <= weekEnd;
    });
  }, [jobs, weekStart, weekEnd]);

  return (
    <div className="h-full flex flex-col">
      {/* Job timelines */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-3">
        {weekJobs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            No applications this week
          </div>
        ) : (
          <div className="space-y-5">
            {weekJobs.map((job) => {
              const steps: TimelineStep[] =
                job.statusHistory && job.statusHistory.length > 0
                  ? job.statusHistory.map((h) => ({
                      status: h.status,
                      date: new Date(h.changedAt),
                    }))
                  : [{ status: "APPLIED", date: new Date(job.appliedDate) }];

              return (
                <div key={job.id} className="border-b border-gray-50 pb-4">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      {job.company}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {job.position}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex items-start gap-0 min-w-fit">
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-start">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                  step.status === "REJECTED"
                                    ? "bg-red-500"
                                    : step.status === "INTERVIEWING"
                                      ? "bg-blue-500"
                                    : "bg-gray-800"
                                }`}
                              />
                              {i < steps.length - 1 && (
                                <div className="w-24 sm:w-32 md:w-40 h-[2px] bg-gray-300 flex-shrink-0" />
                              )}
                            </div>
                            <div className="mt-1.5">
                              <div className="text-xs font-medium text-gray-700">
                                {JOB_STATUS_LABELS[step.status]}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {formatShortDate(step.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-2 border-t border-gray-100 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />
          <span className="text-[10px] text-gray-500">Applied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] text-gray-500">Interviewing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] text-gray-500">Rejected</span>
        </div>
      </div>
    </div>
  );
}
