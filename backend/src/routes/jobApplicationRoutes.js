import { Router } from "express";
import { JobApplicationController } from "../controllers/jobApplicationController.js";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();
const jobApplicationController = new JobApplicationController();

// Create job application
router.post(
  "/",
  authenticateUser,
  jobApplicationController.createJobApplication.bind(jobApplicationController)
);

// Get user job applications
router.get(
  "/",
  authenticateUser,
  jobApplicationController.getUserJobApplications.bind(jobApplicationController)
);

// Search job applications
router.get(
  "/search",
  authenticateUser,
  jobApplicationController.searchJobApplications.bind(jobApplicationController)
);

// Filter by status
router.get(
  "/status/:status",
  authenticateUser,
  jobApplicationController.getJobApplicationsByStatus.bind(
    jobApplicationController
  )
);

// Get by ID
router.get(
  "/:id",
  authenticateUser,
  jobApplicationController.getJobApplicationById.bind(jobApplicationController)
);

// Update job application
router.put(
  "/:id",
  authenticateUser,
  jobApplicationController.updateJobApplication.bind(jobApplicationController)
);

// Delete job application
router.delete(
  "/:id",
  authenticateUser,
  jobApplicationController.deleteJobApplication.bind(jobApplicationController)
);

export default router;