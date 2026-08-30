import { Router } from 'express';
import { getSettings, regenerateApiKey } from '../controllers/settings.controller';
import { jwtAuth } from '../middleware/auth';

export const settingsRoutes = Router();

settingsRoutes.use(jwtAuth);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get user settings and API key
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User settings including API key
 */
settingsRoutes.get('/', getSettings);

/**
 * @swagger
 * /api/settings/regenerate-api-key:
 *   post:
 *     tags: [Settings]
 *     summary: Regenerate API key (invalidates old key)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: New API key generated
 */
settingsRoutes.post('/regenerate-api-key', regenerateApiKey);
