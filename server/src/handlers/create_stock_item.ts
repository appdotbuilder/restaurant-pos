
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type CreateStockItemInput, type StockItem } from '../schema';

export const createStockItem = async (input: CreateStockItemInput): Promise<StockItem> => {
  try {
    // Insert stock item record
    const result = await db.insert(stockItemsTable)
      .values({
        name: input.name,
        description: input.description,
        unit: input.unit,
        current_quantity: input.current_quantity.toString(), // Convert number to string for numeric column
        minimum_quantity: input.minimum_quantity.toString(), // Convert number to string for numeric column
        unit_cost: input.unit_cost.toString(), // Convert number to string for numeric column
        supplier: input.supplier
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const stockItem = result[0];
    return {
      ...stockItem,
      current_quantity: parseFloat(stockItem.current_quantity), // Convert string back to number
      minimum_quantity: parseFloat(stockItem.minimum_quantity), // Convert string back to number
      unit_cost: parseFloat(stockItem.unit_cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Stock item creation failed:', error);
    throw error;
  }
};
