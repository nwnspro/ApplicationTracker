import { supabase } from '../config/supabase.js';
import UrlMetadataService from './urlMetadataService.js';

class TodoJobService {
  /**
   * Create a new todo job
   */
  static async createTodoJob(userId, url) {
    try {
      // Optionally extract metadata when creating (for preview)
      let extractedCompany = null;
      let extractedPosition = null;

      try {
        const metadata = await UrlMetadataService.extractJobMetadata(url);
        extractedCompany = metadata.company;
        extractedPosition = metadata.position;
      } catch (error) {
        console.log('Could not extract metadata on creation, will try later:', error.message);
        // Continue without metadata - user can still add the todo
      }

      const { data: todoJob, error } = await supabase
        .from('todo_jobs')
        .insert([{
          user_id: userId,
          url,
          extracted_company: extractedCompany,
          extracted_position: extractedPosition,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create todo job: ${error.message}`);
      }

      return this.toCamelCase(todoJob);
    } catch (error) {
      console.error('Error creating todo job:', error);
      throw new Error('Failed to create todo job');
    }
  }

  /**
   * Get user's todo jobs
   */
  static async getUserTodoJobs(userId, includeCompleted = false) {
    try {
      let query = supabase
        .from('todo_jobs')
        .select('*')
        .eq('user_id', userId);

      if (!includeCompleted) {
        query = query.eq('completed', false);
      }

      query = query.order('created_at', { ascending: false });

      const { data: todoJobs, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch todo jobs: ${error.message}`);
      }

      return todoJobs.map(todo => this.toCamelCase(todo));
    } catch (error) {
      console.error('Error fetching todo jobs:', error);
      throw new Error('Failed to fetch todo jobs');
    }
  }

  /**
   * Get a single todo job by ID
   */
  static async getTodoJobById(id, userId) {
    try {
      const { data: todoJob, error } = await supabase
        .from('todo_jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Todo job not found');
        }
        throw new Error(`Failed to fetch todo job: ${error.message}`);
      }

      return this.toCamelCase(todoJob);
    } catch (error) {
      console.error('Error fetching todo job:', error);
      throw error;
    }
  }

  /**
   * Complete a todo job and create a job application
   */
  static async completeTodoAndCreateJob(id, userId, tableId = 'table1') {
    try {
      // Get the todo job
      const todoJob = await this.getTodoJobById(id, userId);

      if (todoJob.completed) {
        throw new Error('Todo job already completed');
      }

      // Extract metadata if not already extracted
      let company = todoJob.extractedCompany;
      let position = todoJob.extractedPosition;

      if (!company || !position) {
        try {
          const metadata = await UrlMetadataService.extractJobMetadata(todoJob.url);
          company = metadata.company;
          position = metadata.position;
        } catch (error) {
          console.error('Error extracting metadata:', error);
          // Use fallback values if extraction fails
          company = company || 'Unknown Company';
          position = position || 'Unknown Position';
        }
      }

      // Create job application
      const { data: jobApplication, error: jobError } = await supabase
        .from('job_applications')
        .insert([{
          user_id: userId,
          company,
          position,
          status: 'APPLIED',
          applied_date: new Date().toISOString(),
          table_name: 'Table 1',
        }])
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create job application: ${jobError.message}`);
      }

      // Mark todo as completed
      const { data: updatedTodo, error: todoError } = await supabase
        .from('todo_jobs')
        .update({ completed: true })
        .eq('id', id)
        .select()
        .single();

      if (todoError) {
        // If marking as completed fails, we should ideally rollback the job creation
        // but Supabase doesn't support transactions easily, so we log the error
        console.error('Failed to mark todo as completed:', todoError);
        throw new Error(`Failed to mark todo as completed: ${todoError.message}`);
      }

      return {
        jobApplication: this.toJobCamelCase(jobApplication),
        todoJob: this.toCamelCase(updatedTodo),
      };
    } catch (error) {
      console.error('Error completing todo job:', error);
      throw error;
    }
  }

  /**
   * Delete a todo job
   */
  static async deleteTodoJob(id, userId) {
    try {
      const { error } = await supabase
        .from('todo_jobs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete todo job: ${error.message}`);
      }

      return { message: 'Todo job deleted successfully' };
    } catch (error) {
      console.error('Error deleting todo job:', error);
      throw error;
    }
  }

  /**
   * Update todo job (mainly for re-extracting metadata)
   */
  static async updateTodoJob(id, userId, data) {
    try {
      // Convert camelCase to snake_case
      const updateData = {};
      if (data.extractedCompany !== undefined) updateData.extracted_company = data.extractedCompany;
      if (data.extractedPosition !== undefined) updateData.extracted_position = data.extractedPosition;
      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.url !== undefined) updateData.url = data.url;

      const { data: todoJob, error } = await supabase
        .from('todo_jobs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update todo job: ${error.message}`);
      }

      return this.toCamelCase(todoJob);
    } catch (error) {
      console.error('Error updating todo job:', error);
      throw new Error('Failed to update todo job');
    }
  }

  // Helper: Convert snake_case to camelCase for todo jobs
  static toCamelCase(obj) {
    if (!obj) return obj;

    return {
      id: obj.id,
      userId: obj.user_id,
      url: obj.url,
      extractedCompany: obj.extracted_company,
      extractedPosition: obj.extracted_position,
      completed: obj.completed,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
    };
  }

  // Helper: Convert snake_case to camelCase for job applications
  static toJobCamelCase(obj) {
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

export default TodoJobService;
