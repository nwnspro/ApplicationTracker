export interface SankeyApplication {
  status: string;
  statusHistory?: Array<{ status: string }>;
}

export interface SankeyNodeData {
  id: string;
  label: string;
  level: number;
  order: number;
  value: number;
}

export interface SankeyLinkData {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
}

const nodeDefinitions = [
  { id: "applications", label: "Applications", level: 0, order: 0 },
  { id: "rejected", label: "Rejected", level: 1, order: 0 },
  { id: "interviews", label: "Interviews", level: 1, order: 1 },
  { id: "no-response", label: "No Response", level: 1, order: 2 },
  { id: "no-response-after-interview", label: "No Response", level: 2, order: 0 },
  { id: "no-offer", label: "Rejected", level: 2, order: 1 },
] as const;

function reachedInterview(application: SankeyApplication): boolean {
  return (
    application.status === "INTERVIEWING" ||
    application.statusHistory?.some((entry) =>
      entry.status === "INTERVIEWING",
    ) === true
  );
}

export function buildSankeyData(
  applications: SankeyApplication[],
): SankeyData {
  const reachedApplications = applications.filter(reachedInterview);
  const rejectedApplications = applications.filter(
    (application) => application.status === "REJECTED",
  );
  const rejectedBeforeInterview = rejectedApplications.filter(
    (application) => !reachedInterview(application),
  );
  const noResponse = applications.filter(
    (application) =>
      application.status !== "REJECTED" && !reachedInterview(application),
  );
  const noResponseAfterInterview = applications.filter(
    (application) =>
      reachedInterview(application) && application.status === "INTERVIEWING",
  );
  const noOffer = rejectedApplications.filter(reachedInterview);

  const values: Record<string, number> = {
    applications: applications.length,
    rejected: rejectedBeforeInterview.length,
    interviews: reachedApplications.length,
    "no-response": noResponse.length,
    "no-response-after-interview": noResponseAfterInterview.length,
    "no-offer": noOffer.length,
  };

  const links: SankeyLinkData[] = [
    { source: "applications", target: "rejected", value: values.rejected },
    { source: "applications", target: "interviews", value: values.interviews },
    {
      source: "applications",
      target: "no-response",
      value: values["no-response"],
    },
    {
      source: "interviews",
      target: "no-response-after-interview",
      value: values["no-response-after-interview"],
    },
    { source: "interviews", target: "no-offer", value: values["no-offer"] },
  ].filter((link) => link.value > 0);

  const connectedNodeIds = new Set(
    links.flatMap((link) => [link.source, link.target]),
  );
  if (values.applications > 0) connectedNodeIds.add("applications");

  const nodes = nodeDefinitions
    .filter((definition) => connectedNodeIds.has(definition.id))
    .map((definition) => ({
      ...definition,
      value: values[definition.id],
    }));

  return { nodes, links };
}
