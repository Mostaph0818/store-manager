import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { updateDeliveryRateSchema } from '../validators/delivery.validator';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/delivery/rates
 * Get all delivery rates for the authenticated user
 */
export async function listDeliveryRates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const search = req.query.search as string | undefined;

    const rates = await prisma.deliveryRate.findMany({
      where: {
        userId,
        ...(search && {
          wilayaName: { contains: search,  },
        }),
      },
      orderBy: { wilayaCode: 'asc' },
    });

    sendSuccess(res, rates);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/delivery/rates/:wilayaCode
 * Update delivery rates for a specific wilaya
 */
export async function updateDeliveryRate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const wilayaCode = req.params.wilayaCode as string;

    const input = updateDeliveryRateSchema.parse(req.body);

    // Verify this wilaya belongs to the user
    const existing = await prisma.deliveryRate.findUnique({
      where: { userId_wilayaCode: { userId, wilayaCode } },
    });

    if (!existing) {
      throw new AppError(
        `Delivery rate not found for wilaya: ${wilayaCode}.`,
        404,
        'NOT_FOUND'
      );
    }

    const rate = await prisma.deliveryRate.update({
      where: { userId_wilayaCode: { userId, wilayaCode } },
      data: {
        homeDeliveryPrice: input.homeDeliveryPrice,
        deskDeliveryPrice: input.deskDeliveryPrice,
      },
    });

    sendSuccess(res, rate, 'Delivery rate updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/delivery/rates/bulk
 * Update multiple delivery rates at once
 */
export async function bulkUpdateDeliveryRates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const updates = req.body as Array<{
      wilayaCode: string;
      homeDeliveryPrice: number;
      deskDeliveryPrice: number;
    }>;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('Expected an array of rate updates.', 422, 'INVALID_INPUT');
    }

    // Validate each entry
    for (const update of updates) {
      updateDeliveryRateSchema.parse({
        homeDeliveryPrice: update.homeDeliveryPrice,
        deskDeliveryPrice: update.deskDeliveryPrice,
      });
    }

    // Use transaction for atomic bulk update
    await prisma.$transaction(
      updates.map((update) =>
        prisma.deliveryRate.update({
          where: {
            userId_wilayaCode: { userId, wilayaCode: update.wilayaCode },
          },
          data: {
            homeDeliveryPrice: update.homeDeliveryPrice,
            deskDeliveryPrice: update.deskDeliveryPrice,
          },
        })
      )
    );

    sendSuccess(res, null, 'Delivery rates updated successfully.');
  } catch (error) {
    next(error);
  }
}
