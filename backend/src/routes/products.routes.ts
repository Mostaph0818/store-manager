import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.controller';
import { jwtAuth } from '../middleware/auth';

export const productRoutes = Router();

// All product routes require JWT authentication
productRoutes.use(jwtAuth);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *     responses:
 *       200:
 *         description: List of products
 */
productRoutes.get('/', listProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
productRoutes.get('/:id', getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, costPrice, sellingPrice, stockQuantity]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created
 *       422:
 *         description: Validation error
 */
productRoutes.post('/', createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
productRoutes.put('/:id', updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
productRoutes.delete('/:id', deleteProduct);
