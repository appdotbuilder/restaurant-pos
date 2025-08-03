
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput, type Expense } from '../schema';

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  try {
    // Insert expense record
    const result = await db.insert(expensesTable)
      .values({
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        category: input.category,
        vendor: input.vendor,
        receipt_number: input.receipt_number,
        date: input.date,
        recorded_by: 1 // TODO: Should get from context/session in real implementation
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Expense creation failed:', error);
    throw error;
  }
};
