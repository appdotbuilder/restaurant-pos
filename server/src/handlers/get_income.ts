
import { db } from '../db';
import { incomeTable } from '../db/schema';
import { type Income } from '../schema';
import { desc } from 'drizzle-orm';

export const getIncome = async (): Promise<Income[]> => {
  try {
    const results = await db.select()
      .from(incomeTable)
      .orderBy(desc(incomeTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(income => ({
      ...income,
      amount: parseFloat(income.amount) // Convert numeric string to number
    }));
  } catch (error) {
    console.error('Income retrieval failed:', error);
    throw error;
  }
};
