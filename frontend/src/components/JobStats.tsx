import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { ShareMenu } from "./ShareMenu";
import { getStatsExportOptions } from "../utils/exportUtils";
import { JobStats } from "../types/job";
import {
  SankeyData,
  SankeyLinkData,
  SankeyNodeData,
  buildSankeyData,
} from "../utils/sankeyData";

interface JobStatsProps {
  stats: JobStats;
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

export function JobStatsComponent({ stats }: JobStatsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState(720);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const updateWidth = () => {
      setChartWidth(Math.max(360, chartRef.current?.clientWidth || 720));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    setSvgElement(svgRef.current);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const data: SankeyData = buildSankeyData(stats.applications || []);
    const margin = { top: 24, right: 112, bottom: 24, left: 112 };
    const width = chartWidth;
    const height = Math.max(280, Math.min(420, width * 0.42));

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
      .nodeWidth(14)
      .nodePadding(16)
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
      .style("font", "12px 'Onest', sans-serif")
      .style("fill", "#333")
      .style("opacity", (node) => (isNodeHighlighted(node) ? 1 : 0.3))
      .text((node) => `${node.label} (${node.value})`);
  }, [chartWidth, hoveredPath, stats]);

  const total = stats.total || 0;
  const interviewRate = percent(stats.interviewing || 0, total);
  const rejectedRate = percent(stats.rejected || 0, total);
  const noResponseRate = percent(stats.noResponse || 0, total);

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-4 gap-px border-b border-gray-100">
        <div className="px-6 py-4" style={{ background: "#eef4fb" }}>
          <div className="text-2xl font-semibold" style={{ color: "#6a9dc0" }}>
            {stats.applied || 0}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#7aaac8" }}>
            Applied
          </div>
          <div className="text-xs mt-1 text-gray-400">
            {total} total tracked
          </div>
        </div>
        <div className="px-6 py-4" style={{ background: "#fdf8ec" }}>
          <div className="text-2xl font-semibold" style={{ color: "#c8a44a" }}>
            {stats.interviewing || 0}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#c8a44a" }}>
            Interviewed
          </div>
          <div className="text-xs mt-1 text-gray-400">
            {interviewRate} of applications
          </div>
        </div>
        <div className="px-6 py-4" style={{ background: "#fdf0f0" }}>
          <div className="text-2xl font-semibold" style={{ color: "#c87a7a" }}>
            {stats.rejected || 0}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#c87a7a" }}>
            Rejected
          </div>
          <div className="text-xs mt-1 text-gray-400">
            {rejectedRate} of applications
          </div>
        </div>
        <div className="px-6 py-4" style={{ background: "#f3f5f7" }}>
          <div className="text-2xl font-semibold" style={{ color: "#718096" }}>
            {stats.noResponse || 0}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#718096" }}>
            No Response
          </div>
          <div className="text-xs mt-1 text-gray-400">
            {noResponseRate} of applications
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3 pb-2">
        <div className="flex items-center justify-end mb-2">
          <ShareMenu exportOptions={getStatsExportOptions(svgElement)} />
        </div>
        <div ref={chartRef} className="relative flex-1 min-h-0 overflow-x-auto">
          {tooltip && (
            <div className="absolute right-2 top-2 z-10 rounded bg-gray-900 px-3 py-2 text-xs text-white shadow">
              {tooltip}
            </div>
          )}
          <svg ref={svgRef} className="block h-auto min-w-full" />
        </div>
      </div>
    </div>
  );
}
