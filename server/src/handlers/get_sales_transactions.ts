
import { db } from '../db';
import { salesTransactionsTable } from '../db/schema';
import { type SalesTransaction } from '../schema';

export const getSalesTransactions = async (): Promise<SalesTransaction[]> => {
  try {
    const results = await db.select()
      .from(salesTransactionsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(transaction => ({
      ...transaction,
      total_amount: parseFloat(transaction.total_amount),
      tax_amount: parseFloat(transaction.tax_amount),
      discount_amount: parseFloat(transaction.discount_amount),
      final_amount: parseFloat(transaction.final_amount)
    }));
  } catch (error) {
    console.error('Get sales transactions failed:', error);
    throw error;
  }
};
