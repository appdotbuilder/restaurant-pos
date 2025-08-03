
import { db } from '../db';
import { incomeTable } from '../db/schema';
import { type CreateIncomeInput, type Income } from '../schema';

export const createIncome = async (input: CreateIncomeInput): Promise<Income> => {
  try {
    // Insert income record
    const result = await db.insert(incomeTable)
      .values({
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        category: input.category,
        source: input.source,
        date: input.date,
        recorded_by: 1 // TODO: Should get from context/session
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const income = result[0];
    return {
      ...income,
      amount: parseFloat(income.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Income creation failed:', error);
    throw error;
  }
};
