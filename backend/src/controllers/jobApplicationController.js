import { JobApplicationService } from "../services/jobApplicationService.js";

const jobApplicationService = new JobApplicationService();

class JobApplicationController {
  // Create job application
  async createJobApplication(req, res) {
    try {
      // Get user ID from authenticated session (middleware ensures this exists)
      const userId = req.user.id;

      console.log('Creating job application for user:', userId);
      console.log('Request body:', req.body);

      const data = req.body;
      const jobApplication = await jobApplicationService.createJobApplication(
        userId,
        data
      );

      console.log('Job application created successfully:', jobApplication);
      res.status(201).json(jobApplication);
    } catch (error) {
      console.error("Error creating job application:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get user job applications
  async getUserJobApplications(req, res) {
    try {
      const userId = req.user.id;
      const { status, page, pageSize, sortBy, sortOrder } = req.query;

      const options = {
        status,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 50,
        sortBy: sortBy || 'appliedDate',
        sortOrder: sortOrder || 'desc'
      };

      const result = await jobApplicationService.getUserJobApplications(userId, options);
      res.json(result);
    } catch (error) {
      console.error("Error getting job applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get job application by ID
  async getJobApplicationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const jobApplication = await jobApplicationService.getJobApplicationById(
        id
      );
      if (!jobApplication) {
        return res.status(404).json({ error: "Job application not found" });
      }

      // Verify user permissions
      if (jobApplication.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(jobApplication);
    } catch (error) {
      console.error("Error getting job application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Update job application
  async updateJobApplication(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const data = req.body;

      const updatedJobApplication =
        await jobApplicationService.updateJobApplication(id, userId, data);
      res.json(updatedJobApplication);
    } catch (error) {
      console.error("Error updating job application:", error);
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete job application
  async deleteJobApplication(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await jobApplicationService.deleteJobApplication(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job application:", error);
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Filter by status
  async getJobApplicationsByStatus(req, res) {
    try {
      const { status } = req.params;
      const userId = req.user.id;

      const jobApplications =
        await jobApplicationService.getJobApplicationsByStatus(userId, status);
      res.json(jobApplications);
    } catch (error) {
      console.error("Error getting job applications by status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Search job applications
  async searchJobApplications(req, res) {
    try {
      const { q } = req.query;
      const userId = req.user.id;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          error: "Search query is required",
        });
      }

      const jobApplications = await jobApplicationService.searchJobApplications(
        userId,
        q
      );
      res.json(jobApplications);
    } catch (error) {
      console.error("Error searching job applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export { JobApplicationController };