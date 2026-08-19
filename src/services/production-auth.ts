import crypto from 'node:crypto';
import { ProductionRepository, ProductionUser, UserRole } from '../storage/ProductionRepository';

export interface AuthenticatedSession {
  sessionId: string;
  userId: number;
  role: UserRole;
  name: string;
  email: string;
  expiresAt: Date;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  // Supports scrypt hashes in the form: scrypt$N$r$p$salt$derivedKey
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p)) return false;
  try {
    const derived = crypto.scryptSync(password, Buffer.from(parts[4], 'hex'), 64, { N, r, p });
    return crypto.timingSafeEqual(derived, Buffer.from(parts[5], 'hex'));
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  if (!password || password.length < 12) throw new Error('Password minimal 12 karakter');
  const salt = crypto.randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const derived = crypto.scryptSync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export class ProductionAuthService {
  constructor(private readonly repository: ProductionRepository) {}

  async login(email: string, password: string): Promise<AuthenticatedSession | null> {
    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) return null;
    const session = await this.repository.createSession(user.id, 24);
    return this.toSession(user, session);
  }

  async authenticate(sessionId: string): Promise<AuthenticatedSession | null> {
    if (!sessionId) return null;
    const session = await this.repository.getSession(sessionId);
    if (!session) return null;
    const user = await this.repository.findUserById(session.userId);
    if (!user || !user.isActive) return null;
    return this.toSession(user, session);
  }

  async logout(sessionId: string): Promise<void> {
    if (sessionId) await this.repository.revokeSession(sessionId);
  }

  private toSession(user: ProductionUser, session: { id: string; expiresAt: Date }): AuthenticatedSession {
    return {
      sessionId: session.id,
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      expiresAt: session.expiresAt
    };
  }
}
