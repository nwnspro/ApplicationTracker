import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { Job } from "../types/job";

// CSV export functionality
export const exportToCSV = (jobs: Job[]) => {
  // Define CSV headers
  const headers = ["Date", "Company", "Job", "Status", "Notes", "URL"];

  // Convert data to CSV format
  const csvContent = [
    headers.join(","),
    ...jobs.map((job) =>
      [
        job.appliedDate || "",
        `"${job.company}"`,
        `"${job.position}"`,
        job.status,
        `"${job.notes || ""}"`,
        job.url || "",
      ].join(",")
    ),
  ].join("\n");

  // Create Blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const fileName = `job-applications-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  saveAs(blob, fileName);
};

// Google Sheets export functionality
export const exportToGoogleSheets = async (jobs: Job[]) => {
  // Check if user is logged in (implement according to your authentication system)
  const isLoggedIn = checkUserLoginStatus();

  if (!isLoggedIn) {
    alert("Please login to use Google Sheets export feature");
    return;
  }

  try {
    // Prepare data
    const data = jobs.map((job) => ({
      date: job.appliedDate || "",
      company: job.company,
      position: job.position,
      status: job.status,
      notes: job.notes || "",
      url: job.url || "",
    }));

    // Get authentication token
    const token = localStorage.getItem("authToken");

    // Create Google Sheets API request
    const response = await fetch("/api/export/google-sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        window.open(result.sheetUrl, "_blank");
      } else {
        throw new Error(result.message || "Export failed");
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Export failed");
    }
  } catch (error) {
    console.error("Google Sheets export error:", error);
    alert(
      `Failed to export to Google Sheets: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Check user login status (implement according to your authentication system)
const checkUserLoginStatus = (): boolean => {
  // Implement according to your authentication system
  // For example, check token in localStorage, or call authentication API
  const token = localStorage.getItem("authToken");
  return !!token;
};

// Export Sankey diagram as image
export const exportSankeyAsImage = async (svgElement: SVGSVGElement) => {
  try {
    // Use html2canvas to convert SVG to image
    const canvas = await html2canvas(svgElement as unknown as HTMLElement, {
      backgroundColor: "#ffffff",
      scale: 2, // Improve image quality
      useCORS: true,
      allowTaint: true,
    });

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `sankey-diagram-${
          new Date().toISOString().split("T")[0]
        }.png`;
        saveAs(blob, fileName);
      }
    }, "image/png");
  } catch (error) {
    console.error("Image export error:", error);
    alert("Image export failed, please try again later");
  }
};

// Export share menu component data
export interface ExportOption {
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
}

export const getTableExportOptions = (jobs: Job[]): ExportOption[] => [
  {
    label: "Export as CSV",
    icon: "",
    action: () => exportToCSV(jobs),
  },
  {
    label: "Export to Google Sheets",
    icon: "",
    action: () => exportToGoogleSheets(jobs),
    disabled: !checkUserLoginStatus(),
  },
];

export const getStatsExportOptions = (
  svgElement: SVGSVGElement | null
): ExportOption[] => [
  {
    label: "Save Image",
    icon: "",
    action: () => svgElement && exportSankeyAsImage(svgElement),
    disabled: !svgElement,
  },
];
