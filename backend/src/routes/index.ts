import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { productRoutes } from './products.routes';
import { orderRoutes } from './orders.routes';
import { deliveryRoutes } from './delivery.routes';
import { settingsRoutes } from './settings.routes';
import { dashboardRoutes } from './dashboard.routes';
import { v1Routes } from './v1';
import { defaultLimiter } from '../middleware/rateLimiter';

export const apiRoutes = Router();

// Apply default rate limiter to all API routes
apiRoutes.use(defaultLimiter);

// Auth routes
apiRoutes.use('/auth', authRoutes);

// Dashboard (JWT protected)
apiRoutes.use('/dashboard', dashboardRoutes);

// Product management (JWT protected)
apiRoutes.use('/products', productRoutes);

// Order management (JWT protected)
apiRoutes.use('/orders', orderRoutes);

// Delivery rates (JWT protected)
apiRoutes.use('/delivery', deliveryRoutes);

// Settings (JWT protected)
apiRoutes.use('/settings', settingsRoutes);

// n8n API v1 (API Key protected)
apiRoutes.use('/v1', v1Routes);
