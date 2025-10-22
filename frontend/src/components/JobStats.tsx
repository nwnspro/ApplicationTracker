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
    const height = 280;

    // Analyze job flows - simplified to match actual statuses
    const analyzeJobFlows = () => {
      const appliedCount = jobs.filter(j => j.status === "APPLIED").length;
      const interviewingCount = jobs.filter(j => j.status === "INTERVIEWING").length;
      const rejectedCount = jobs.filter(j => j.status === "REJECTED").length;
      const offerCount = jobs.filter(j => j.status === "OFFER").length;

      return {
        appliedCount: jobs.length, // Total applications
        interviewingCount,
        rejectedCount,
        offerCount,
        // For flow: assume interviewed jobs come from applied
        appliedStillWaiting: appliedCount,
        movedToInterview: interviewingCount + rejectedCount + offerCount,
      };
    };

    const flows = analyzeJobFlows();

    // Create nodes based on actual status counts
    const allNodes = [
      { name: "Applied", id: 0, value: flows.appliedCount },
      { name: "Still Waiting", id: 1, value: flows.appliedStillWaiting },
      { name: "In Process", id: 2, value: flows.movedToInterview },
      { name: "Interviewing", id: 3, value: flows.interviewingCount },
      { name: "Offers", id: 4, value: flows.offerCount },
      { name: "Rejected", id: 5, value: flows.rejectedCount },
    ];

    // Filter out nodes with 0 value
    const nodes: SankeyNode[] = allNodes.filter((node) => node.value > 0);

    // Create a mapping from old IDs to new IDs
    const idMapping: { [key: number]: number } = {};
    nodes.forEach((node, index) => {
      idMapping[node.id] = index;
      node.id = index;
    });

    // Create links based on actual job flows
    const allLinks = [
      // From Applied to Still Waiting
      { source: 0, target: 1, value: flows.appliedStillWaiting },
      // From Applied to In Process
      { source: 0, target: 2, value: flows.movedToInterview },
      // From In Process to Interviewing
      { source: 2, target: 3, value: flows.interviewingCount },
      // From In Process to Offers
      { source: 2, target: 4, value: flows.offerCount },
      // From In Process to Rejected
      { source: 2, target: 5, value: flows.rejectedCount },
    ];

    // Filter links: only include if value > 0 and both source and target nodes exist
    const links: SankeyLink[] = allLinks
      .filter(
        (link) =>
          link.value > 0 &&
          nodes.some((n) => n.id === idMapping[link.source]) &&
          nodes.some((n) => n.id === idMapping[link.target])
      )
      .map((link) => ({
        source: idMapping[link.source],
        target: idMapping[link.target],
        value: link.value,
      }));

    // Create sankey generator
    const margin = { top: 20, right: 30, bottom: 30, left: 30 };
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(25)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

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

    // Color scheme - matching status badge colors
    const colorScale = d3
      .scaleOrdinal()
      .domain(["Applied", "Still Waiting", "In Process", "Interviewing", "Offers", "Rejected"])
      .range([
        "#3b82f6", // Applied - blue (matching Applied badge)
        "#93c5fd", // Still Waiting - light blue
        "#fbbf24", // In Process - yellow/amber
        "#fcd34d", // Interviewing - yellow (matching Interviewing badge)
        "#22c55e", // Offers - green (matching Offer badge)
        "#ef4444", // Rejected - red (matching Rejected badge)
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
      .text((d) => `${d.name} (${d.value || 0})`);
  }, [stats, jobs]);

  return (
    <div className="h-full p-3 sm:p-4 md:p-6 flex flex-col">
      {/* Top Statistics Cards with spacing - Smaller */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border">
          <div className="text-lg sm:text-xl font-bold text-blue-600">
            {stats.applied || 0}
          </div>
          <div className="text-xs text-blue-600">Applied</div>
        </div>

        <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg border">
          <div className="text-lg sm:text-xl font-bold text-yellow-600">
            {stats.interviewing || 0}
          </div>
          <div className="text-xs text-yellow-600">Interviewing</div>
        </div>

        <div className="bg-red-50 p-2 sm:p-3 rounded-lg border">
          <div className="text-lg sm:text-xl font-bold text-red-600">
            {stats.rejected || 0}
          </div>
          <div className="text-xs text-red-600">Rejected</div>
        </div>

        <div className="bg-green-50 p-2 sm:p-3 rounded-lg border">
          <div className="text-lg sm:text-xl font-bold text-green-600">
            {stats.offer || 0}
          </div>
          <div className="text-xs text-green-600">Offers</div>
        </div>
      </div>

      {/* Sankey Diagram Section - Larger */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg flex-1 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <h4 className="text-sm sm:text-md font-medium">
            Application Status Distribution
          </h4>
          <ShareMenu exportOptions={getStatsExportOptions(svgElement)} />
        </div>
        <div className="h-64 sm:h-72 md:h-80 overflow-x-auto">
          <svg ref={svgRef} className="w-full h-full min-w-[600px]"></svg>
        </div>
      </div>
    </div>
  );
}
