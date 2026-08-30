import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * API Key authentication middleware for n8n integrations.
 * Reads x-api-key header, validates it against the database,
 * and attaches the authenticated user to req.user.
 *
 * SECURITY: The user identity is ALWAYS derived from the API key,
 * never from any value in the request body or query params.
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({
      success: false,
      message: 'API key is required. Include x-api-key header in your request.',
      code: 'API_KEY_REQUIRED',
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: { id: true, username: true, email: true, apiKey: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key.',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    // req.user.id is the ONLY source of user identity for all subsequent queries
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
