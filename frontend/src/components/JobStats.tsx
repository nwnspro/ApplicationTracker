import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { ShareMenu } from "./ShareMenu";
import { getStatsExportOptions } from "../utils/exportUtils";

interface JobStatsProps {
  stats: any;
  jobs?: any[]; // Add jobs data to analyze status history
}

interface SankeyNode {
  name: string;
  id: number;
  value?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  width?: number;
}

export function JobStatsComponent({ stats, jobs = [] }: JobStatsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Set SVG element reference
    setSvgElement(svgRef.current);

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Calculate container dimensions for Sankey
    const width = 1100;

    const buildStatusFlow = () => {
      const transitions: Record<string, number> = {};
      const nodeCounts: Record<string, number> = {};
      const statusOrder = ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN", "NO_RESPONSE"];

      const normalizeStatus = (status?: string) => status || "APPLIED";

      jobs.forEach((job) => {
        const history = Array.isArray(job.statusHistory) && job.statusHistory.length > 0
          ? [...job.statusHistory].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
          : [{ status: job.status, changedAt: job.updatedAt || job.appliedDate }];

        const statuses = history
          .map((entry) => normalizeStatus(entry.status))
          .filter((status, index, list) => index === 0 || status !== list[index - 1]);

        statuses.forEach((status) => {
          nodeCounts[status] = (nodeCounts[status] || 0) + 1;
        });

        for (let i = 1; i < statuses.length; i += 1) {
          const key = `${statuses[i - 1]}__${statuses[i]}`;
          transitions[key] = (transitions[key] || 0) + 1;
        }
      });

      const orderedNames = Array.from(new Set([...statusOrder, ...Object.keys(nodeCounts)])).sort(
        (a, b) => {
          const aIndex = statusOrder.indexOf(a);
          const bIndex = statusOrder.indexOf(b);

          if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        }
      );

      const nodes: SankeyNode[] = orderedNames
        .map((name, index) => ({
          name,
          id: index,
          value: nodeCounts[name] || 0,
        }))
        .filter((node) => node.value > 0);

      const idMap: Record<string, number> = {};
      nodes.forEach((node, index) => {
        idMap[node.name] = index;
      });

      const links: SankeyLink[] = Object.entries(transitions)
        .map(([key, value]) => {
          const [sourceName, targetName] = key.split("__");
          if (idMap[sourceName] === undefined || idMap[targetName] === undefined) {
            return null;
          }

          return {
            source: idMap[sourceName],
            target: idMap[targetName],
            value,
          };
        })
        .filter(Boolean) as SankeyLink[];

      return { nodes, links };
    };

    const { nodes, links } = buildStatusFlow();
    const height = Math.max(280, nodes.length * 72 + 120);

    // Create sankey generator
    const margin = { top: 20, right: 30, bottom: 30, left: 30 };
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(18)
      .nodePadding(16)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    // Bail out if no data to render
    if (nodes.length === 0 || links.length === 0) {
      d3.select(svgRef.current)
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font", "14px 'Onest', sans-serif")
        .style("fill", "#999")
        .text("No application data yet");
      return;
    }

    // Generate the sankey layout
    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    // Color scheme - soft muted palette
    const colorScale = d3
      .scaleOrdinal()
      .domain(["APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN", "NO_RESPONSE"])
      .range([
        "#a8c4e0",
        "#f5e09a",
        "#9ecfaa",
        "#e8a5a5",
        "#c7c7c7",
        "#f0b36b",
      ]);

    // Add links
    svg
      .append("g")
      .selectAll("path")
      .data(sankeyLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d) => colorScale((d.source as any).name) as string)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", (d) => Math.max(1, (d as any).width || 0))
      .attr("fill", "none")
      .style("mix-blend-mode", "multiply");

    // Add nodes
    const nodeGroup = svg
      .append("g")
      .selectAll("g")
      .data(sankeyNodes)
      .join("g");

    nodeGroup
      .append("rect")
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("height", (d) => Math.max(1, (d.y1 || 0) - (d.y0 || 0)))
      .attr("width", (d) => Math.max(1, (d.x1 || 0) - (d.x0 || 0)))
      .attr("fill", (d) => colorScale(d.name) as string)
      .attr("stroke", "none");

    // Add node labels
    nodeGroup
      .append("text")
      .attr("x", (d) =>
        (d.x0 || 0) < width / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6
      )
      .attr("y", (d) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => ((d.x0 || 0) < width / 2 ? "start" : "end"))
      .style("font", "11px 'Onest', sans-serif")
      .style("fill", "#333")
      .text((d) => {
        const labelMap: Record<string, string> = {
          APPLIED: "Applied",
          INTERVIEWING: "Interviewing",
          OFFER: "Offers",
          REJECTED: "Rejected",
          WITHDRAWN: "Withdrawn",
          NO_RESPONSE: "No Response",
        };

        return `${labelMap[d.name] || d.name} (${d.value || 0})`;
      });
  }, [stats, jobs]);

  const total = (stats.applied || 0) + (stats.interviewing || 0) + (stats.rejected || 0) + (stats.offer || 0);
  const interviewRate = total > 0 ? Math.round(((stats.interviewing || 0) / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round(((stats.offer || 0) / total) * 100) : 0;
  const rejectedRate = total > 0 ? Math.round(((stats.rejected || 0) / total) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-px border-b border-gray-100">
        <div className="px-6 py-4" style={{ background: "#eef4fb" }}>
          <div className="text-2xl font-semibold" style={{ color: "#6a9dc0" }}>{stats.applied || 0}</div>
          <div className="text-xs mt-0.5" style={{ color: "#7aaac8" }}>Applied</div>
          <div className="text-xs mt-1 text-gray-400">{total} total tracked</div>
        </div>
        <div className="px-6 py-4" style={{ background: "#fdf8ec" }}>
          <div className="text-2xl font-semibold" style={{ color: "#c8a44a" }}>{stats.interviewing || 0}</div>
          <div className="text-xs mt-0.5" style={{ color: "#c8a44a" }}>Interviewing</div>
          <div className="text-xs mt-1 text-gray-400">{interviewRate}% of applications</div>
        </div>
        <div className="px-6 py-4" style={{ background: "#fdf0f0" }}>
          <div className="text-2xl font-semibold" style={{ color: "#c87a7a" }}>{stats.rejected || 0}</div>
          <div className="text-xs mt-0.5" style={{ color: "#c87a7a" }}>Rejected</div>
          <div className="text-xs mt-1 text-gray-400">{rejectedRate}% of applications</div>
        </div>
        <div className="px-6 py-4" style={{ background: "#eef6f0" }}>
          <div className="text-2xl font-semibold" style={{ color: "#5fa870" }}>{stats.offer || 0}</div>
          <div className="text-xs mt-0.5" style={{ color: "#5fa870" }}>Offers</div>
          <div className="text-xs mt-1 text-gray-400">{offerRate}% success rate</div>
        </div>
      </div>

      {/* Sankey fills remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3 pb-2">
        <div className="flex items-center justify-end mb-2">
          <ShareMenu exportOptions={getStatsExportOptions(svgElement)} />
        </div>
        <div className="flex-1 overflow-x-auto">
          <svg ref={svgRef} className="w-full h-full min-w-[600px]"></svg>
        </div>
      </div>
    </div>
  );
}
