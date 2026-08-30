import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

/**
 * GET /api/v1/products/check?name=ProductName
 * Check product availability — used by n8n workflows
 *
 * @swagger
 * /api/v1/products/check:
 *   get:
 *     tags: [v1 Products]
 *     summary: Check product availability
 *     description: Search for a product by name and return its availability and price.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Product name to search for (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         name: { type: string }
 *                         available: { type: boolean }
 *                         stock_quantity: { type: integer }
 *                         selling_price: { type: string }
 *       400:
 *         description: Missing product name
 *       401:
 *         description: Invalid or missing API key
 *       404:
 *         description: Product not found
 */
export async function checkProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const name = req.query.name as string;

    if (!name || name.trim().length === 0) {
      throw new AppError('Product name is required as a query parameter.', 400, 'MISSING_PARAM');
    }

    // Flexible search: case-insensitive, partial match within user's products only
    const product = await prisma.product.findFirst({
      where: {
        userId,
        name: { contains: name.trim(),  },
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        isOutOfStock: true,
        sellingPrice: true,
      },
      orderBy: { name: 'asc' }, // Return best match if multiple found
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found.',
        code: 'PRODUCT_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          available: !product.isOutOfStock && product.stockQuantity > 0,
          stock_quantity: product.stockQuantity,
          selling_price: product.sellingPrice,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
