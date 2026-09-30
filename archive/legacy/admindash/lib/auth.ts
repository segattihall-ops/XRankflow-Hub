import { User, UserRole } from '@/types/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Simulated user database (em produção, usar banco de dados real)
const USERS_DB = [
  {
    id: '1',
    email: process.env.ADMIN_EMAIL || 'admin@XRankFlow.com',
    // Senha será hasheada em runtime
    password: '', // será preenchido pela função hashPassword
    name: 'Administrador',
    role: 'admin' as UserRole,
  },
  {
    id: '2',
    email: 'manager@XRankFlow.com',
    password: '',
    name: 'Gerente',
    role: 'manager' as UserRole,
  },
  {
    id: '3',
    email: 'viewer@XRankFlow.com',
    password: '',
    name: 'Visualizador',
    role: 'viewer' as UserRole,
  },
];

// Hash da senha do admin (executado em runtime)
let usersInitialized = false;

async function initializeUsers() {
  if (usersInitialized) return;

  const adminPassword = process.env.ADMIN_PASSWORD || '<REDACTED_LEGACY_PASSWORD>';
  USERS_DB[0].password = await bcrypt.hash(adminPassword, 10);
  USERS_DB[1].password = await bcrypt.hash('<REDACTED_TEST_PASSWORD>', 10);
  USERS_DB[2].password = await bcrypt.hash('<REDACTED_TEST_PASSWORD>', 10);

  usersInitialized = true;
}

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  await initializeUsers();

  const user = USERS_DB.find(u => u.email === email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch {
    return null;
  }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    manager: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
