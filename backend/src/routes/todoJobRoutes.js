import express from 'express';
import TodoJobController from '../controllers/todoJobController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Create a new todo job
router.post('/', authenticateUser, TodoJobController.createTodoJob);

// Get user's todo jobs
router.get('/', authenticateUser, TodoJobController.getTodoJobs);

// Get a single todo job
router.get('/:id', authenticateUser, TodoJobController.getTodoJobById);

// Complete todo job and create job application
router.post('/:id/complete', authenticateUser, TodoJobController.completeTodoJob);

// Update a todo job
router.put('/:id', authenticateUser, TodoJobController.updateTodoJob);

// Delete a todo job
router.delete('/:id', authenticateUser, TodoJobController.deleteTodoJob);

export default router;
