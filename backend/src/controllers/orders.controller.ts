import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export type OrderStatus = 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';

/**
 * GET /api/orders
 * List orders with filtering and sorting
 */
export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
      status,
      wilayaCode,
      search,
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }
    if (wilayaCode) {
      where.wilayaCode = wilayaCode;
    }
    if (search) {
      where.customerName = { contains: search };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: where as any,
        include: {
          product: { select: { id: true, name: true } },
        },
        orderBy: {
          createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where: where as any }),
    ]);

    sendSuccess(res, {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:id
 */
export async function getOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = parseInt((req.params.id as string), 10);

    if (isNaN(id)) {
      throw new AppError('Invalid order ID.', 400, 'INVALID_ID');
    }

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        product: { select: { id: true, name: true, sellingPrice: true } },
      },
    });

    if (!order) {
      throw new AppError('Order not found.', 404, 'NOT_FOUND');
    }

    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/orders/:id/status
 * Update order status, with stock restoration on cancellation
 */
export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = parseInt((req.params.id as string), 10);

    if (isNaN(id)) {
      throw new AppError('Invalid order ID.', 400, 'INVALID_ID');
    }

    const { status } = updateOrderStatusSchema.parse(req.body);

    // Fetch the order within a transaction to prevent race conditions
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId },
      });

      if (!order) {
        throw new AppError('Order not found.', 404, 'NOT_FOUND');
      }

      // Prevent updating an already-cancelled order
      if (order.status === 'cancelled' && status === 'cancelled') {
        throw new AppError(
          'Order is already cancelled.',
          409,
          'ALREADY_CANCELLED'
        );
      }

      // Restore stock when cancelling a non-cancelled order
      if (status === 'cancelled' && order.status !== 'cancelled') {
        await tx.product.update({
          where: { id: order.productId },
          data: {
            stockQuantity: { increment: order.quantity },
            isOutOfStock: false,
          },
        });
      }

      // If re-activating a cancelled order, deduct stock again
      if (order.status === 'cancelled' && status !== 'cancelled') {
        const product = await tx.product.findUnique({
          where: { id: order.productId },
        });

        if (!product || product.stockQuantity < order.quantity) {
          throw new AppError(
            'Insufficient stock to reactivate this order.',
            422,
            'INSUFFICIENT_STOCK'
          );
        }

        const newQty = product.stockQuantity - order.quantity;
        await tx.product.update({
          where: { id: order.productId },
          data: {
            stockQuantity: newQty,
            isOutOfStock: newQty === 0,
          },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: {
          product: { select: { id: true, name: true } },
        },
      });
    });

    sendSuccess(res, updatedOrder, 'Order status updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/orders
 */
export async function createOrderDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const input = createOrderSchema.parse(req.body);
    const order = await createOrderTransaction(userId, input);
    sendCreated(res, order, 'Order created successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Shared order creation transaction used by both dashboard and n8n API.
 */
export async function createOrderTransaction(
  userId: number,
  input: {
    customerName: string;
    customerPhone: string;
    wilayaCode: string;
    address: string;
    productId: number;
    quantity: number;
    deliveryType: 'home' | 'desk';
  }
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: input.productId, userId },
    });

    if (!product) {
      throw new AppError(
        'Product not found or does not belong to your account.',
        404,
        'PRODUCT_NOT_FOUND'
      );
    }

    if (input.quantity <= 0) {
      throw new AppError('Quantity must be at least 1.', 422, 'INVALID_QUANTITY');
    }

    if (product.isOutOfStock || product.stockQuantity < input.quantity) {
      throw new AppError(
        `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${input.quantity}.`,
        422,
        'INSUFFICIENT_STOCK'
      );
    }

    // Get delivery rate from DB — never trust client-provided prices
    const deliveryRate = await tx.deliveryRate.findUnique({
      where: {
        userId_wilayaCode: { userId, wilayaCode: input.wilayaCode },
      },
    });

    if (!deliveryRate) {
      throw new AppError(
        `Delivery rate not found for wilaya code: ${input.wilayaCode}.`,
        404,
        'DELIVERY_RATE_NOT_FOUND'
      );
    }

    const unitPrice = Number(product.sellingPrice);
    const deliveryFee =
      input.deliveryType === 'home'
        ? Number(deliveryRate.homeDeliveryPrice)
        : Number(deliveryRate.deskDeliveryPrice);

    const totalAmount = unitPrice * input.quantity + deliveryFee;

    // Create the order
    const order = await tx.order.create({
      data: {
        userId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        wilayaCode: input.wilayaCode,
        wilayaName: deliveryRate.wilayaName,
        address: input.address,
        productId: product.id,
        quantity: input.quantity,
        productUnitPrice: unitPrice,
        deliveryType: input.deliveryType,
        deliveryFee,
        totalAmount,
        status: 'pending',
      },
      include: {
        product: { select: { id: true, name: true } },
      },
    });

    // Deduct stock
    const newQuantity = product.stockQuantity - input.quantity;
    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: newQuantity,
        isOutOfStock: newQuantity === 0,
      },
    });

    return order;
  });
}
