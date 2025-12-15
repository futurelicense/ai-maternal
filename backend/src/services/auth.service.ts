import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { memoryStore } from '../db/memory-store.js';
import { env } from '../config/env.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_EXPIRY = '7d';

  async register(data: { email: string; password: string; name: string }) {
    // Check if user exists
    const existingUser = await memoryStore.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const newUser = await memoryStore.createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'user',
    });

    // Generate token
    const token = this.generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await memoryStore.findUserByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  generateToken(user: AuthUser): string {
    return jwt.sign(user, env.JWT_SECRET, { expiresIn: this.JWT_EXPIRY });
  }

  verifyToken(token: string): AuthUser {
    try {
      return jwt.verify(token, env.JWT_SECRET) as AuthUser;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async createDefaultUser() {
    // Create demo user if not exists
    const demoEmail = 'demo@healthai.com';
    const existingUser = await memoryStore.findUserByEmail(demoEmail);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', this.SALT_ROUNDS);
      await memoryStore.createUser({
        email: demoEmail,
        password: hashedPassword,
        name: 'Dr. Sarah Chen',
        role: 'admin',
      });
      console.log('✅ Demo user created: demo@healthai.com / password123');
    }
  }
}

export const authService = new AuthService();
