
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users with simple password hash
    const passwordHash = 'hashed_password_123';
    
    await db.insert(usersTable).values([
      {
        username: 'admin_user',
        email: 'admin@test.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true
      },
      {
        username: 'manager_user',
        email: 'manager@test.com',
        password_hash: passwordHash,
        role: 'manager',
        is_active: true
      },
      {
        username: 'cashier_user',
        email: 'cashier@test.com',
        password_hash: passwordHash,
        role: 'cashier',
        is_active: false
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify first user
    const adminUser = result.find(u => u.username === 'admin_user');
    expect(adminUser).toBeDefined();
    expect(adminUser?.email).toEqual('admin@test.com');
    expect(adminUser?.role).toEqual('admin');
    expect(adminUser?.is_active).toBe(true);
    expect(adminUser?.id).toBeDefined();
    expect(adminUser?.created_at).toBeInstanceOf(Date);
    expect(adminUser?.updated_at).toBeInstanceOf(Date);

    // Verify inactive user is also returned
    const cashierUser = result.find(u => u.username === 'cashier_user');
    expect(cashierUser).toBeDefined();
    expect(cashierUser?.is_active).toBe(false);
  });

  it('should return users with all required fields', async () => {
    const passwordHash = 'test_password_hash';
    
    await db.insert(usersTable).values({
      username: 'test_user',
      email: 'test@example.com',
      password_hash: passwordHash,
      role: 'staff',
      is_active: true
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Verify all required fields are present and correct types
    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof user.is_active).toBe('boolean');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple users with different roles', async () => {
    const passwordHash = 'test_password_hash';
    
    const testUsers = [
      { username: 'user1', email: 'user1@test.com', role: 'admin' as const },
      { username: 'user2', email: 'user2@test.com', role: 'manager' as const },
      { username: 'user3', email: 'user3@test.com', role: 'cashier' as const },
      { username: 'user4', email: 'user4@test.com', role: 'staff' as const }
    ];

    await db.insert(usersTable).values(
      testUsers.map(user => ({
        ...user,
        password_hash: passwordHash,
        is_active: true
      }))
    ).execute();

    const result = await getUsers();

    expect(result).toHaveLength(4);
    
    // Verify all roles are represented
    const roles = result.map(u => u.role).sort();
    expect(roles).toEqual(['admin', 'cashier', 'manager', 'staff']);
  });
});
