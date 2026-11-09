import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { Job, JobStats } from "../types/job";
import {
  SankeyData,
  SankeyLinkData,
  SankeyNodeData,
  buildSankeyData,
} from "../utils/sankeyData";
import { WeeklyTimeline, WeekNav, getWeekBounds } from "./WeeklyTimeline";

interface JobStatsProps {
  stats: JobStats;
  jobs: Job[];
}

type LayoutNode = SankeyNodeData & {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
};

type LayoutLink = SankeyLinkData & {
  source: LayoutNode;
  target: LayoutNode;
  width?: number;
};

const nodeColors: Record<string, string> = {
  applications: "#9b958d",
  rejected: "#7186a2",
  interviews: "#d9954b",
  "no-response": "#c48d96",
  "no-response-after-interview": "#c48d96",
  "no-offer": "#d4776e",
};

function percent(value: number, total: number): string {
  return `${total > 0 ? Math.round((value / total) * 100) : 0}%`;
}

export function JobStatsComponent({ stats, jobs }: JobStatsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [chartWidth, setChartWidth] = useState(720);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [statsView, setStatsView] = useState<"all" | "weekly">("all");
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!chartRef.current) return;

    const updateWidth = () => {
      setChartWidth(chartRef.current?.clientWidth || 720);
    };
    updateWidth();

    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(entry.contentRect.width || 720);
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const data: SankeyData = buildSankeyData(stats.applications || []);
    const margin = {
      top: 24,
      right: Math.min(144, Math.max(96, chartWidth * 0.14)),
      bottom: 24,
      left: Math.min(144, Math.max(96, chartWidth * 0.16)),
    };
    const width = chartWidth;
    const height = Math.max(280, Math.min(420, width * 0.42));
    const nodeWidth = width < 520 ? 10 : 14;
    const nodePadding = width < 520 ? 10 : 16;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    if (data.nodes.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font", "14px 'Onest', sans-serif")
        .style("fill", "#999")
        .text("No application data yet");
      return;
    }

    const sankeyLayout = sankey<SankeyNodeData, SankeyLinkData>()
      .nodeId((node) => node.id)
      .nodeAlign((node) => node.level)
      .nodeSort((first, second) => first.order - second.order)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    const layout = sankeyLayout({
      nodes: data.nodes.map((node) => ({ ...node })),
      links: data.links.map((link) => ({ ...link })),
    });
    const nodes = layout.nodes as LayoutNode[];
    const links = layout.links as LayoutLink[];
    const root = svg.append("g");
    const total = stats.total || 0;

    const linkKey = (link: LayoutLink) =>
      `${link.source.id}->${link.target.id}`;
    const nodeKey = (node: LayoutNode) => `node:${node.id}`;
    const isHighlighted = (key: string) => !hoveredPath || hoveredPath === key;
    const isNodeHighlighted = (node: LayoutNode) =>
      !hoveredPath ||
      hoveredPath === nodeKey(node) ||
      links.some(
        (link) =>
          linkKey(link) === hoveredPath &&
          (link.source.id === node.id || link.target.id === node.id),
      );

    root
      .append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", sankeyLinkHorizontal<LayoutNode, LayoutLink>())
      .attr("fill", "none")
      .attr("stroke", (link) => nodeColors[link.target.id])
      .attr("stroke-width", (link) => Math.max(1, link.width || 0))
      .attr("stroke-opacity", (link) =>
        isHighlighted(linkKey(link)) ? 0.46 : 0.12,
      )
      .on("mouseenter", function (_event, link) {
        const key = linkKey(link);
        setHoveredPath(key);
        setTooltip(
          `${link.source.label} -> ${link.target.label}: ${link.value} (${percent(link.value, total)})`,
        );
      })
      .on("mouseleave", function () {
        setHoveredPath(null);
        setTooltip(null);
      });

    const nodeGroups = root
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .on("mouseenter", function (_event, node) {
        setHoveredPath(nodeKey(node));
        setTooltip(
          `${node.label}: ${node.value} (${percent(node.value, total)})`,
        );
      })
      .on("mouseleave", function () {
        setHoveredPath(null);
        setTooltip(null);
      });

    nodeGroups
      .append("rect")
      .attr("x", (node) => node.x0 || 0)
      .attr("y", (node) => node.y0 || 0)
      .attr("width", (node) => Math.max(1, (node.x1 || 0) - (node.x0 || 0)))
      .attr("height", (node) => Math.max(1, (node.y1 || 0) - (node.y0 || 0)))
      .attr("fill", (node) => nodeColors[node.id])
      .attr("opacity", (node) => (isNodeHighlighted(node) ? 1 : 0.3));

    nodeGroups
      .append("text")
      .attr("x", (node) =>
        node.level === 0 ? (node.x0 || 0) - 8 : (node.x1 || 0) + 8,
      )
      .attr("y", (node) => ((node.y0 || 0) + (node.y1 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (node) => (node.level === 0 ? "end" : "start"))
      .style("font", `${width < 520 ? 10 : 12}px 'Onest', sans-serif`)
      .style("fill", "#333")
      .style("opacity", (node) => (isNodeHighlighted(node) ? 1 : 0.3))
      .text((node) => `${node.label} (${node.value})`);
  }, [chartWidth, hoveredPath, stats]);

  const total = stats.total || 0;
  const interviewRate = percent(stats.interviewing || 0, total);
  const rejectedRate = percent(stats.rejected || 0, total);
  const noResponseRate = percent(stats.noResponse || 0, total);

  // Weekly stats — computed from jobs filtered by appliedDate in the selected week
  const weeklyStats = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    const { start, end } = getWeekBounds(ref);

    const weekJobs = jobs.filter((job) => {
      const dateStr = job.appliedDate.split("T")[0];
      const [y, m, d] = dateStr.split("-").map(Number);
      const applied = new Date(y, m - 1, d);
      return applied >= start && applied <= end;
    });

    const wTotal = weekJobs.length;
    const wInterviewing = weekJobs.filter(
      (j) =>
        j.status === "INTERVIEWING" ||
        j.statusHistory?.some((h) => h.status === "INTERVIEWING"),
    ).length;
    const wRejected = weekJobs.filter((j) => j.status === "REJECTED").length;
    const wNoResponse = weekJobs.filter(
      (j) =>
        j.status === "APPLIED" &&
        !j.statusHistory?.some((h) => h.status === "INTERVIEWING"),
    ).length;

    return {
      applied: wTotal,
      interviewing: wInterviewing,
      rejected: wRejected,
      noResponse: wNoResponse,
      total: wTotal,
      interviewRate: percent(wInterviewing, wTotal),
      rejectedRate: percent(wRejected, wTotal),
      noResponseRate: percent(wNoResponse, wTotal),
    };
  }, [jobs, weekOffset]);

  // Pick which stats to display in the cards
  const ds = statsView === "weekly"
    ? {
        applied: weeklyStats.applied,
        interviewing: weeklyStats.interviewing,
        rejected: weeklyStats.rejected,
        noResponse: weeklyStats.noResponse,
        total: weeklyStats.total,
        interviewRate: weeklyStats.interviewRate,
        rejectedRate: weeklyStats.rejectedRate,
        noResponseRate: weeklyStats.noResponseRate,
      }
    : {
        applied: stats.applied || 0,
        interviewing: stats.interviewing || 0,
        rejected: stats.rejected || 0,
        noResponse: stats.noResponse || 0,
        total,
        interviewRate,
        rejectedRate,
        noResponseRate,
      };

  return (
    <div className="h-full flex flex-col">
      {/* Row 1: View toggle (+ week nav when weekly) */}
      <div className="flex items-center px-4 py-2.5 flex-shrink-0">
        {/* Segmented toggle */}
        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5">
          <button
            onClick={() => setStatsView("all")}
            className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
              statsView === "all"
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatsView("weekly")}
            className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
              statsView === "weekly"
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Weekly
          </button>
        </div>

        {/* Week navigation — only visible in weekly mode */}
        {statsView === "weekly" && (
          <WeekNav weekOffset={weekOffset} onWeekOffsetChange={setWeekOffset} />
        )}
      </div>

      {/* Row 2: Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 px-4 py-2.5 flex-shrink-0">
        {/* Applied */}
        <div className="bg-white border border-[#efeae0] rounded-[12px] px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6a9dc0]" />
            <span className="text-[13px] font-medium text-zinc-700">Applied</span>
          </div>
          <div className="flex items-baseline gap-2 min-h-[28px]">
            <span className="text-[26px] font-semibold leading-none text-zinc-900">
              {ds.applied}
            </span>
          </div>
        </div>

        {/* Interviewed */}
        <div className="bg-white border border-[#efeae0] rounded-[12px] px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d9a93a]" />
            <span className="text-[13px] font-medium text-zinc-700">Interviewed</span>
          </div>
          <div className="flex items-baseline gap-2 min-h-[28px]">
            <span className="text-[26px] font-semibold leading-none text-zinc-900">
              {ds.interviewing}
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-semibold leading-[18px] bg-[#fdf6e3] text-[#8a6a12]">
              {ds.interviewRate}
            </span>
            <span className="text-[13px] text-stone-600">
              {ds.interviewing} of {ds.total}
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-[#efeae0] rounded-[12px] px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#c96b6b]" />
            <span className="text-[13px] font-medium text-zinc-700">Rejected</span>
          </div>
          <div className="flex items-baseline gap-2 min-h-[28px]">
            <span className="text-[26px] font-semibold leading-none text-zinc-900">
              {ds.rejected}
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-semibold leading-[18px] bg-[#fdeeee] text-[#a43d3d]">
              {ds.rejectedRate}
            </span>
            <span className="text-[13px] text-stone-600">
              {ds.rejected} of {ds.total}
            </span>
          </div>
        </div>

        {/* No Response */}
        <div className="bg-white border border-[#efeae0] rounded-[12px] px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9aa6b2]" />
            <span className="text-[13px] font-medium text-zinc-700">No Response</span>
          </div>
          <div className="flex items-baseline gap-2 min-h-[28px]">
            <span className="text-[26px] font-semibold leading-none text-zinc-900">
              {ds.noResponse}
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-semibold leading-[18px] bg-[#f1f4f7] text-[#4b5b6b]">
              {ds.noResponseRate}
            </span>
            <span className="text-[13px] text-stone-600">
              {ds.noResponse} of {ds.total}
            </span>
          </div>
        </div>
      </div>

      {/* Content area */}
      {statsView === "weekly" && (
        <div className="flex-1 min-h-0">
          <WeeklyTimeline jobs={jobs} weekOffset={weekOffset} />
        </div>
      )}
      <div className={`flex-1 flex flex-col overflow-hidden px-4 pt-2 pb-2 ${statsView !== "all" ? "hidden" : ""}`}>
        <div className="h-1" />
        <div ref={chartRef} className="relative flex-1 min-h-0 overflow-hidden">
          {tooltip && (
            <div className="absolute right-2 top-2 z-10 rounded bg-gray-900 px-3 py-2 text-xs text-white shadow">
              {tooltip}
            </div>
          )}
          <svg ref={svgRef} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
