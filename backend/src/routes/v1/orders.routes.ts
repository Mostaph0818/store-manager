import { Router } from 'express';
import { createOrder } from '../../controllers/v1/orders.controller';

export const v1OrderRoutes = Router();

v1OrderRoutes.post('/', createOrder);
