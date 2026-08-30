import { Router } from 'express';
import { getDeliveryRate } from '../../controllers/v1/delivery.controller';

export const v1DeliveryRoutes = Router();

v1DeliveryRoutes.get('/rate', getDeliveryRate);
