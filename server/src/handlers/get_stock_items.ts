
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type StockItem } from '../schema';

export const getStockItems = async (): Promise<StockItem[]> => {
  try {
    const results = await db.select()
      .from(stockItemsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(item => ({
      ...item,
      current_quantity: parseFloat(item.current_quantity),
      minimum_quantity: parseFloat(item.minimum_quantity),
      unit_cost: parseFloat(item.unit_cost)
    }));
  } catch (error) {
    console.error('Get stock items failed:', error);
    throw error;
  }
};
