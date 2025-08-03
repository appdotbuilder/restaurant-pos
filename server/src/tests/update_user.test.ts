
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<number> => {
  const result = await db.insert(usersTable)
    .values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password_123',
      role: 'staff',
      is_active: true
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user username', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'updateduser'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('test@example.com'); // unchanged
    expect(result.role).toEqual('staff'); // unchanged
    expect(result.is_active).toEqual(true); // unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user email', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'updated@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // unchanged
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('staff'); // unchanged
  });

  it('should update user role', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      role: 'manager'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.role).toEqual('manager');
    expect(result.username).toEqual('testuser'); // unchanged
    expect(result.email).toEqual('test@example.com'); // unchanged
  });

  it('should update user active status', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.is_active).toEqual(false);
    expect(result.username).toEqual('testuser'); // unchanged
  });

  it('should update multiple fields at once', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'newusername',
      email: 'new@example.com',
      role: 'admin',
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('newusername');
    expect(result.email).toEqual('new@example.com');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'saveduser',
      role: 'cashier'
    };

    await updateUser(updateInput);

    // Verify changes are persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('saveduser');
    expect(users[0].role).toEqual('cashier');
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should update timestamp on any change', async () => {
    const userId = await createTestUser();
    
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'timestamptest'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUser[0].updated_at.getTime());
  });
});
