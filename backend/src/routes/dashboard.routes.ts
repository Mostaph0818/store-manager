import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { jwtAuth } from '../middleware/auth';

export const dashboardRoutes = Router();

dashboardRoutes.use(jwtAuth);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics including products, orders, revenue
 */
dashboardRoutes.get('/stats', getDashboardStats);
