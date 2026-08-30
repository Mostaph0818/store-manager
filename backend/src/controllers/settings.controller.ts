import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { generateApiKey } from '../utils/apiKey';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/settings
 * Get current user settings (without password or full API key)
 */
export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        apiKey: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/settings/regenerate-api-key
 * Invalidates the old API key and generates a new one
 */
export async function regenerateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const newApiKey = generateApiKey();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { apiKey: newApiKey },
      select: { id: true, username: true, email: true, apiKey: true },
    });

    sendSuccess(res, { apiKey: user.apiKey }, 'API key regenerated. The old key is now invalid.');
  } catch (error) {
    next(error);
  }
}
