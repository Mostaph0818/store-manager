import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { generateApiKey } from '../utils/apiKey';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { ALGERIAN_WILAYAS } from '../utils/wilayas';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper to seed delivery rates for all 69 wilayas for a user
 */
async function seedUserDeliveryRates(userId: number) {
  for (const wilaya of ALGERIAN_WILAYAS) {
    await prisma.deliveryRate.upsert({
      where: {
        userId_wilayaCode: {
          userId,
          wilayaCode: wilaya.code,
        },
      },
      update: {},
      create: {
        userId,
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        homeDeliveryPrice: 500,
        deskDeliveryPrice: 350,
      },
    });
  }
}

/**
 * POST /api/auth/register
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);

    // Check if email already exists
    const existingByEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingByEmail) {
      throw new AppError('البريد الإلكتروني مستخدم بالفعل.', 409, 'EMAIL_TAKEN');
    }

    // Check if username already exists
    const existingByUsername = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existingByUsername) {
      throw new AppError('اسم المستخدم مستخدم بالفعل.', 409, 'USERNAME_TAKEN');
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(input.password, 10);
    const apiKey = generateApiKey();

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        apiKey,
      },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    // Auto-seed delivery rates for all 69 wilayas for the new user
    await seedUserDeliveryRates(user.id);

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      ({ expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any)
    );

    sendCreated(res, { user, token }, 'تم إنشاء الحساب بنجاح.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    const passwordMatch =
      user !== null && (await bcrypt.compare(input.password, user.passwordHash));

    if (!user || !passwordMatch) {
      throw new AppError(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      ({ expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any)
    );

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
      'تم تسجيل الدخول بنجاح.'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google
 * Verifies a real Google ID token from the frontend and signs in or creates the user.
 */
export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { credential } = req.body;

    if (!credential) {
      throw new AppError('Google credential token is required.', 400, 'MISSING_CREDENTIAL');
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google Sign-In is not configured on the server.', 503, 'GOOGLE_NOT_CONFIGURED');
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token payload.', 401, 'INVALID_GOOGLE_TOKEN');
    }

    const { email, name, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      let baseUsername = (name || normalizedEmail.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase();
      if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;

      let username = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      const randomPassword = `google_${googleId}_${Math.random()}`;
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const apiKey = generateApiKey();

      user = await prisma.user.create({
        data: { username, email: normalizedEmail, passwordHash, apiKey },
      });

      await seedUserDeliveryRates(user.id);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      ({ expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any)
    );

    sendSuccess(
      res,
      { user: { id: user.id, username: user.username, email: user.email }, token },
      'تم تسجيل الدخول بحساب Google بنجاح.'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('غير مصرح.', 401, 'UNAUTHORIZED');
    }

    sendSuccess(res, {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    });
  } catch (error) {
    next(error);
  }
}
