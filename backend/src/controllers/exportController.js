class ExportController {
  // Export to Google Sheets - Feature disabled (googleapis removed)
  async exportToGoogleSheets(req, res) {
    res.status(501).json({
      error: "Google Sheets export is not available",
      message: "Please use CSV export instead",
    });
  }

  // Export as CSV (backup option)
  exportToCSV(req, res) {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      // Generate CSV content
      const headers = ["Date", "Company", "Job", "Status", "Notes", "URL"];
      const csvContent = [
        headers.join(","),
        ...data.map((job) =>
          [
            job.date,
            `"${job.company}"`,
            `"${job.position}"`,
            job.status,
            `"${job.notes || ""}"`,
            job.url || "",
          ].join(",")
        ),
      ].join("\n");

      // Set response headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="job-applications-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );

      res.send(csvContent);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({
        error: "CSV export failed",
        message: error.message,
      });
    }
  }
}

export { ExportController };
