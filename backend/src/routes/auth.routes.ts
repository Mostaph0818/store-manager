import { Router } from 'express';
import { register, login, getMe, googleAuth } from '../controllers/auth.controller';
import { jwtAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

export const authRoutes = Router();

authRoutes.post('/register', authLimiter, register);
authRoutes.post('/login', authLimiter, login);
authRoutes.post('/google', authLimiter, googleAuth);
authRoutes.get('/me', jwtAuth, getMe);
