import { Router } from 'express';
import { checkProduct } from '../../controllers/v1/products.controller';

export const v1ProductRoutes = Router();

v1ProductRoutes.get('/check', checkProduct);
