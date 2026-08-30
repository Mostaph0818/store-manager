import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

/**
 * GET /api/v1/delivery/rate?wilaya=19&delivery_type=home
 * Get delivery rate for a specific wilaya and delivery type
 *
 * @swagger
 * /api/v1/delivery/rate:
 *   get:
 *     tags: [v1 Delivery]
 *     summary: Get delivery rate for a wilaya
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: wilaya
 *         required: true
 *         schema:
 *           type: string
 *         description: Wilaya code (e.g. "19" for Sétif)
 *       - in: query
 *         name: delivery_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, desk]
 *         description: Delivery type
 *     responses:
 *       200:
 *         description: Delivery rate found
 *       400:
 *         description: Missing parameters
 *       401:
 *         description: Invalid API key
 *       404:
 *         description: Wilaya not found
 */
export async function getDeliveryRate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const wilaya = req.query.wilaya as string;
    const deliveryType = req.query.delivery_type as string;

    if (!wilaya || wilaya.trim().length === 0) {
      throw new AppError('wilaya query parameter is required.', 400, 'MISSING_PARAM');
    }

    if (!deliveryType || !['home', 'desk'].includes(deliveryType)) {
      throw new AppError(
        'delivery_type query parameter must be "home" or "desk".',
        400,
        'INVALID_PARAM'
      );
    }

    const rate = await prisma.deliveryRate.findUnique({
      where: {
        userId_wilayaCode: { userId, wilayaCode: wilaya.trim() },
      },
    });

    if (!rate) {
      res.status(404).json({
        success: false,
        message: `No delivery rate found for wilaya code: ${wilaya}.`,
        code: 'WILAYA_NOT_FOUND',
      });
      return;
    }

    const deliveryFee =
      deliveryType === 'home' ? rate.homeDeliveryPrice : rate.deskDeliveryPrice;

    res.status(200).json({
      success: true,
      data: {
        wilaya: {
          code: rate.wilayaCode,
          name: rate.wilayaName,
        },
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
      },
    });
  } catch (error) {
    next(error);
  }
}
