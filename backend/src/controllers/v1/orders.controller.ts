import { Request, Response, NextFunction } from 'express';
import { createOrderSchema } from '../../validators/order.validator';
import { createOrderTransaction } from '../orders.controller';
import { sendCreated } from '../../utils/response';

/**
 * POST /api/v1/orders
 * Create an order from n8n workflow
 *
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [v1 Orders]
 *     summary: Create a new order (n8n)
 *     description: |
 *       Creates an order and automatically deducts stock.
 *       Prices are always fetched from the database — client prices are ignored.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_name, customer_phone, wilaya_code, address, product_id, quantity, delivery_type]
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: Ahmed Ben Ali
 *               customer_phone:
 *                 type: string
 *                 example: "0550123456"
 *               wilaya_code:
 *                 type: string
 *                 example: "19"
 *               address:
 *                 type: string
 *                 example: "12 rue des Fleurs, Sétif"
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               delivery_type:
 *                 type: string
 *                 enum: [home, desk]
 *                 example: home
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid API key
 *       404:
 *         description: Product or delivery rate not found
 *       422:
 *         description: Insufficient stock
 */
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    // Support both camelCase and snake_case input from n8n
    const rawBody = req.body;
    const normalizedBody = {
      customerName: rawBody.customerName || rawBody.customer_name,
      customerPhone: rawBody.customerPhone || rawBody.customer_phone,
      wilayaCode: rawBody.wilayaCode || rawBody.wilaya_code,
      address: rawBody.address,
      productId: rawBody.productId || rawBody.product_id,
      quantity: rawBody.quantity,
      deliveryType: rawBody.deliveryType || rawBody.delivery_type,
    };

    const input = createOrderSchema.parse(normalizedBody);
    const order = await createOrderTransaction(userId, input);

    sendCreated(res, order, 'Order created successfully.');
  } catch (error) {
    next(error);
  }
}
