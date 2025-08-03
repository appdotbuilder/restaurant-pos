
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type Expense } from '../schema';
import { desc } from 'drizzle-orm';

export async function getExpenses(): Promise<Expense[]> {
  try {
    const results = await db.select()
      .from(expensesTable)
      .orderBy(desc(expensesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount)
    }));
  } catch (error) {
    console.error('Get expenses failed:', error);
    throw error;
  }
}
