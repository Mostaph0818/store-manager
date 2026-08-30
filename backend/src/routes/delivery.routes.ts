import { Router } from 'express';
import {
  listDeliveryRates,
  updateDeliveryRate,
  bulkUpdateDeliveryRates,
} from '../controllers/delivery.controller';
import { jwtAuth } from '../middleware/auth';

export const deliveryRoutes = Router();

deliveryRoutes.use(jwtAuth);

/**
 * @swagger
 * /api/delivery/rates:
 *   get:
 *     tags: [Delivery]
 *     summary: Get all delivery rates
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by wilaya name
 *     responses:
 *       200:
 *         description: List of delivery rates for all 58 wilayas
 */
deliveryRoutes.get('/rates', listDeliveryRates);

/**
 * @swagger
 * /api/delivery/rates/bulk:
 *   put:
 *     tags: [Delivery]
 *     summary: Bulk update delivery rates
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [wilayaCode, homeDeliveryPrice, deskDeliveryPrice]
 *               properties:
 *                 wilayaCode:
 *                   type: string
 *                 homeDeliveryPrice:
 *                   type: number
 *                 deskDeliveryPrice:
 *                   type: number
 *     responses:
 *       200:
 *         description: Rates updated
 */
deliveryRoutes.put('/rates/bulk', bulkUpdateDeliveryRates);

/**
 * @swagger
 * /api/delivery/rates/{wilayaCode}:
 *   put:
 *     tags: [Delivery]
 *     summary: Update delivery rate for a specific wilaya
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wilayaCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "19"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [homeDeliveryPrice, deskDeliveryPrice]
 *             properties:
 *               homeDeliveryPrice:
 *                 type: number
 *               deskDeliveryPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Rate updated
 */
deliveryRoutes.put('/rates/:wilayaCode', updateDeliveryRate);
