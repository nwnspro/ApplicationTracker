import { supabase } from '../config/supabase.js';
import { ValidationUtils } from '../utils/validation.js';

class JobApplicationService {
  // Create job application
  async createJobApplication(userId, data) {
    // Validate input data - the method returns boolean
    const isValid = ValidationUtils.validateCreateJobApplicationRequest(data);
    if (!isValid) {
      throw new Error('Validation failed: Invalid job application data');
    }

    const jobApplicationData = {
      user_id: userId,
      company: data.company.trim(),
      position: data.position ? data.position.trim() : data.company.trim() + ' Position',
      status: data.status || 'APPLIED',
      notes: data.notes || null,
      applied_date: data.appliedDate ? new Date(data.appliedDate).toISOString() : new Date().toISOString(),
      table_name: data.tableName || 'Table 1',
    };

    const { data: jobApplication, error } = await supabase
      .from('job_applications')
      .insert([jobApplicationData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job application: ${error.message}`);
    }

    return this.toCamelCase(jobApplication);
  }

  // Get all job applications for user
  async getUserJobApplications(userId, options = {}) {
    const {
      status,
      page = 1,
      pageSize = 50,
      sortBy = 'appliedDate',
      sortOrder = 'desc'
    } = options;

    // Build query
    let query = supabase
      .from('job_applications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    // Convert camelCase to snake_case for sorting
    const sortColumn = sortBy === 'appliedDate' ? 'applied_date' :
                       sortBy === 'updatedAt' ? 'updated_at' : sortBy;

    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: jobApplications, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch job applications: ${error.message}`);
    }

    return {
      jobApplications: jobApplications.map(job => this.toCamelCase(job)),
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  }

  // Get job application by ID
  async getJobApplicationById(id) {
    const { data: jobApplication, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch job application: ${error.message}`);
    }

    return this.toCamelCase(jobApplication);
  }

  // Update job application
  async updateJobApplication(id, userId, data) {
    // Check if job application exists and belongs to user
    const existingJobApplication = await this.getJobApplicationById(id);

    if (!existingJobApplication) {
      throw new Error('Job application not found');
    }

    if (existingJobApplication.userId !== userId) {
      throw new Error('Unauthorized: Cannot update this job application');
    }

    // Validate update data - the method returns boolean
    const isValid = ValidationUtils.validateUpdateJobApplicationRequest(data);
    if (!isValid) {
      throw new Error('Validation failed: Invalid update data');
    }

    // Prepare update data (convert to snake_case)
    const updateData = {};
    if (data.company) updateData.company = data.company.trim();
    if (data.position) updateData.position = data.position.trim();
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.appliedDate) updateData.applied_date = new Date(data.appliedDate).toISOString();
    if (data.tableName !== undefined) updateData.table_name = data.tableName;

    const { data: updated, error } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job application: ${error.message}`);
    }

    return this.toCamelCase(updated);
  }

  // Delete job application
  async deleteJobApplication(id, userId) {
    // Check if job application exists and belongs to user
    const existingJobApplication = await this.getJobApplicationById(id);

    if (!existingJobApplication) {
      throw new Error('Job application not found');
    }

    if (existingJobApplication.userId !== userId) {
      throw new Error('Unauthorized: Cannot delete this job application');
    }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job application: ${error.message}`);
    }
  }

  // Get job applications by status
  async getJobApplicationsByStatus(userId, status) {
    const { data: jobApplications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('applied_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch job applications: ${error.message}`);
    }

    return jobApplications.map(job => this.toCamelCase(job));
  }

  // Search job applications
  async searchJobApplications(userId, query) {
    const { data: jobApplications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .or(`company.ilike.%${query}%,position.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('applied_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to search job applications: ${error.message}`);
    }

    return jobApplications.map(job => this.toCamelCase(job));
  }

  // Helper: Convert snake_case to camelCase
  toCamelCase(obj) {
    if (!obj) return obj;

    return {
      id: obj.id,
      userId: obj.user_id,
      company: obj.company,
      position: obj.position,
      status: obj.status,
      notes: obj.notes,
      appliedDate: obj.applied_date,
      tableName: obj.table_name,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
    };
  }
}

export { JobApplicationService };
