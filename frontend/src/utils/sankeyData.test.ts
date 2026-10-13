import { describe, expect, it } from "vitest";
import { buildSankeyData } from "./sankeyData";

const application = (status: string, history: string[] = []) => ({
  status,
  statusHistory: history.map((entry) => ({ status: entry })),
});

describe("buildSankeyData", () => {
  it("routes all applied applications to No Response", () => {
    const data = buildSankeyData([
      application("APPLIED"),
      application("APPLIED"),
    ]);

    expect(data.links).toEqual([
      { source: "applications", target: "no-response", value: 2 },
    ]);
    expect(data.nodes.map((node) => node.id)).toEqual([
      "applications",
      "no-response",
    ]);
  });

  it("separates rejected applications before and after interview", () => {
    const data = buildSankeyData([
      application("REJECTED"),
      application("REJECTED", ["APPLIED", "INTERVIEWING"]),
      application("INTERVIEWING", ["APPLIED", "INTERVIEWING"]),
    ]);

    expect(data.links).toEqual([
      { source: "applications", target: "rejected", value: 1 },
      { source: "applications", target: "interviews", value: 2 },
      {
        source: "interviews",
        target: "no-response-after-interview",
        value: 1,
      },
      { source: "interviews", target: "no-offer", value: 1 },
    ]);
  });

  it("hides zero-value nodes and links", () => {
    const data = buildSankeyData([application("APPLIED")]);

    expect(data.nodes.every((node) => node.value > 0)).toBe(true);
    expect(data.links.every((link) => link.value > 0)).toBe(true);
    expect(data.nodes.map((node) => node.id)).not.toContain("interviews");
  });

  it("keeps application totals balanced", () => {
    const data = buildSankeyData([
      application("APPLIED"),
      application("REJECTED"),
      application("REJECTED", ["INTERVIEWING"]),
      application("INTERVIEWING", ["INTERVIEWING"]),
    ]);
    const applications = data.nodes.find((node) => node.id === "applications");
    const outgoing = data.links
      .filter((link) => link.source === "applications")
      .reduce((total, link) => total + link.value, 0);

    expect(applications?.value).toBe(4);
    expect(outgoing).toBe(applications?.value);
  });
});
