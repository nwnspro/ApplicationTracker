import { JobStatus } from "../types/index.js";

class ValidationUtils {
  // Validate URL format for auto-fill feature
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate job application data for errors (returns array of errors)
  static validateJobApplication(data) {
    const errors = [];

    if (!data.company || data.company.trim().length === 0) {
      errors.push("Company name is required");
    }

    if (!data.position || data.position.trim().length === 0) {
      errors.push("Position is required");
    }

    if (data.url && !this.isValidUrl(data.url)) {
      errors.push("Invalid job URL format");
    }

    return errors;
  }

  // Validate user data structure (returns boolean)
  static validateUser(user) {
    return (
      user &&
      typeof user.id === "string" &&
      typeof user.email === "string" &&
      typeof user.name === "string"
    );
  }

  // Validate complete job application object (returns boolean)
  static validateJobApplicationObject(jobApp) {
    return (
      jobApp &&
      typeof jobApp.id === "string" &&
      typeof jobApp.userId === "string" &&
      typeof jobApp.company === "string" &&
      typeof jobApp.position === "string" &&
      Object.values(JobStatus).includes(jobApp.status) &&
      (jobApp.notes === null || typeof jobApp.notes === "string") &&
      (jobApp.url === undefined || jobApp.url === null || typeof jobApp.url === "string")
    );
  }

  // Validate create request data (returns boolean)
  static validateCreateJobApplicationRequest(data) {
    return (
      data &&
      typeof data.company === "string" &&
      (data.position === undefined || typeof data.position === "string") &&
      (data.status === undefined || Object.values(JobStatus).includes(data.status)) &&
      (data.notes === undefined || data.notes === null || typeof data.notes === "string") &&
      (data.url === undefined || data.url === null || typeof data.url === "string")
    );
  }

  // Validate update request data (returns boolean)
  static validateUpdateJobApplicationRequest(data) {
    return (
      data &&
      (data.company === undefined || typeof data.company === "string") &&
      (data.position === undefined || typeof data.position === "string") &&
      (data.status === undefined || Object.values(JobStatus).includes(data.status)) &&
      (data.notes === undefined || data.notes === null || typeof data.notes === "string") &&
      (data.url === undefined || data.url === null || typeof data.url === "string")
    );
  }

  // Validate date format
  static isValidDate(date) {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  // Clean and sanitize string input
  static sanitizeString(input) {
    if (!input) return "";
    return input.trim().replace(/\s+/g, " ");
  }

  // Validate pagination parameters
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    return {
      page: Math.max(1, pageNum),
      limit: Math.min(100, Math.max(1, limitNum)),
    };
  }
}

export { ValidationUtils };