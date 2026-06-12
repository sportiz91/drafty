import { eq } from 'drizzle-orm';

import { db } from '@/database/database';
import { users, type NewUser, type User } from '@/database/schema/users-schema';

export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await db
    .update(users)
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
