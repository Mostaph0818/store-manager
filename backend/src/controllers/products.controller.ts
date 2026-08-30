import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/products
 * List all products for the authenticated user with optional search
 */
export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const search = req.query.search as string | undefined;

    const products = await prisma.product.findMany({
      where: {
        userId,
        ...(search && {
          name: { contains: search,  },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, products);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:id
 */
export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = parseInt((req.params.id as string), 10);

    if (isNaN(id)) {
      throw new AppError('Invalid product ID.', 400, 'INVALID_ID');
    }

    const product = await prisma.product.findFirst({
      where: { id, userId }, // userId enforces tenant isolation
    });

    if (!product) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products
 */
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const input = createProductSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        barcode: input.barcode,
        category: input.category,
        imageUrl: input.imageUrl,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        stockQuantity: input.stockQuantity,
        isOutOfStock: input.stockQuantity === 0,
      },
    });

    sendCreated(res, product, 'Product created successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/products/:id
 */
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = parseInt((req.params.id as string), 10);

    if (isNaN(id)) {
      throw new AppError('Invalid product ID.', 400, 'INVALID_ID');
    }

    const input = updateProductSchema.parse(req.body);

    // Verify ownership before updating
    const existing = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    // Compute new stock quantity and out-of-stock status
    const newStockQuantity =
      input.stockQuantity !== undefined ? input.stockQuantity : existing.stockQuantity;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.barcode !== undefined && { barcode: input.barcode }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
        ...(input.sellingPrice !== undefined && { sellingPrice: input.sellingPrice }),
        ...(input.stockQuantity !== undefined && { stockQuantity: input.stockQuantity }),
        isOutOfStock: newStockQuantity === 0,
      },
    });

    sendSuccess(res, product, 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/products/:id
 */
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = parseInt((req.params.id as string), 10);

    if (isNaN(id)) {
      throw new AppError('Invalid product ID.', 400, 'INVALID_ID');
    }

    // Verify ownership before deleting
    const existing = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    await prisma.product.delete({ where: { id } });

    sendSuccess(res, null, 'Product deleted successfully.');
  } catch (error) {
    next(error);
  }
}
