import TodoJobService from '../services/todoJobService.js';
import { ValidationUtils } from '../utils/validation.js';

class TodoJobController {
  /**
   * Create a new todo job
   */
  static async createTodoJob(req, res) {
    try {
      const { url } = req.body;
      const userId = req.user.id;

      // Validate URL
      if (!url || !ValidationUtils.isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          message: 'Valid URL is required',
        });
      }

      const todoJob = await TodoJobService.createTodoJob(userId, url);

      res.status(201).json({
        success: true,
        message: 'Todo job created successfully',
        data: todoJob,
      });
    } catch (error) {
      console.error('Error in createTodoJob:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create todo job',
      });
    }
  }

  /**
   * Get user's todo jobs
   */
  static async getTodoJobs(req, res) {
    try {
      const userId = req.user.id;
      const includeCompleted = req.query.includeCompleted === 'true';

      const todoJobs = await TodoJobService.getUserTodoJobs(userId, includeCompleted);

      res.status(200).json({
        success: true,
        data: todoJobs,
      });
    } catch (error) {
      console.error('Error in getTodoJobs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch todo jobs',
      });
    }
  }

  /**
   * Get a single todo job
   */
  static async getTodoJobById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const todoJob = await TodoJobService.getTodoJobById(id, userId);

      res.status(200).json({
        success: true,
        data: todoJob,
      });
    } catch (error) {
      console.error('Error in getTodoJobById:', error);
      res.status(error.message === 'Todo job not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch todo job',
      });
    }
  }

  /**
   * Complete a todo job and create job application
   */
  static async completeTodoJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { tableId } = req.body;

      const result = await TodoJobService.completeTodoAndCreateJob(id, userId, tableId);

      res.status(200).json({
        success: true,
        message: 'Todo job completed and job application created',
        data: result,
      });
    } catch (error) {
      console.error('Error in completeTodoJob:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete todo job',
      });
    }
  }

  /**
   * Delete a todo job
   */
  static async deleteTodoJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await TodoJobService.deleteTodoJob(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in deleteTodoJob:', error);
      res.status(error.message === 'Todo job not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete todo job',
      });
    }
  }

  /**
   * Update a todo job
   */
  static async updateTodoJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const data = req.body;

      // Validate URL if provided
      if (data.url && !ValidationUtils.isValidUrl(data.url)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format',
        });
      }

      const todoJob = await TodoJobService.updateTodoJob(id, userId, data);

      res.status(200).json({
        success: true,
        message: 'Todo job updated successfully',
        data: todoJob,
      });
    } catch (error) {
      console.error('Error in updateTodoJob:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update todo job',
      });
    }
  }
}

export default TodoJobController;
