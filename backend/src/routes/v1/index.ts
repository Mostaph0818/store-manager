import { Router } from 'express';
import { apiKeyAuth } from '../../middleware/apiKeyAuth';
import { apiKeyLimiter } from '../../middleware/rateLimiter';
import { v1ProductRoutes } from './products.routes';
import { v1OrderRoutes } from './orders.routes';
import { v1DeliveryRoutes } from './delivery.routes';

export const v1Routes = Router();

// All v1 routes are protected by API key and rate limited
v1Routes.use(apiKeyLimiter);
v1Routes.use(apiKeyAuth);

v1Routes.use('/products', v1ProductRoutes);
v1Routes.use('/orders', v1OrderRoutes);
v1Routes.use('/delivery', v1DeliveryRoutes);
