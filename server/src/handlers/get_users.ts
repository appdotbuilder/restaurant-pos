
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .execute();

    return results.map(user => ({
      ...user,
      // All fields are already in correct types from the database
      // Boolean, string, number, and Date fields don't need conversion
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
