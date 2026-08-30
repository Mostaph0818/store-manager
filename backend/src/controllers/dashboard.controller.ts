import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/dashboard/stats
 * Returns statistics for the authenticated user's dashboard
 */
export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const [
      totalProducts,
      outOfStockProducts,
      totalOrders,
      newOrders,
      recentOrders,
      salesAggregate,
      inventoryProducts,
    ] = await Promise.all([
      // Total products
      prisma.product.count({ where: { userId } }),

      // Out of stock products
      prisma.product.count({ where: { userId, isOutOfStock: true } }),

      // Total orders
      prisma.order.count({ where: { userId } }),

      // New (pending) orders
      prisma.order.count({ where: { userId, status: 'pending' } }),

      // Last 10 orders
      prisma.order.findMany({
        where: { userId },
        include: {
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Total revenue from delivered orders
      prisma.order.aggregate({
        where: { userId, status: 'delivered' },
        _sum: { totalAmount: true },
      }),

      // Products for inventory valuation
      prisma.product.findMany({
        where: { userId },
        select: { costPrice: true, stockQuantity: true },
      }),
    ]);

    // Calculate inventory value
    const totalInventoryValue = inventoryProducts.reduce((acc, p) => {
      return acc + Number(p.costPrice) * p.stockQuantity;
    }, 0);

    sendSuccess(res, {
      totalProducts,
      outOfStockProducts,
      totalOrders,
      newOrders,
      totalRevenue: salesAggregate._sum.totalAmount || 0,
      inventoryValue: totalInventoryValue,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
}
