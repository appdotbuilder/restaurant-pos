
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type UpdateStockInput, type StockItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStock = async (input: UpdateStockInput): Promise<StockItem> => {
  try {
    // First, get the existing stock item to validate it exists
    const existingItems = await db.select()
      .from(stockItemsTable)
      .where(eq(stockItemsTable.id, input.id))
      .execute();

    if (existingItems.length === 0) {
      throw new Error(`Stock item with id ${input.id} not found`);
    }

    const existingItem = existingItems[0];
    const currentQuantity = parseFloat(existingItem.current_quantity);
    const newQuantity = currentQuantity + input.quantity_change;

    // Prevent negative stock quantities
    if (newQuantity < 0) {
      throw new Error(`Insufficient stock. Current quantity: ${currentQuantity}, requested change: ${input.quantity_change}`);
    }

    // Prepare update values
    const updateValues: any = {
      current_quantity: newQuantity.toString(),
    };

    // Update unit cost if provided
    if (input.unit_cost !== undefined) {
      updateValues.unit_cost = input.unit_cost.toString();
    }

    // Update last_restocked_at timestamp if quantity is increasing (restock)
    if (input.quantity_change > 0) {
      updateValues.last_restocked_at = new Date();
    }

    // Update the stock item
    const result = await db.update(stockItemsTable)
      .set(updateValues)
      .where(eq(stockItemsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedItem = result[0];
    return {
      ...updatedItem,
      current_quantity: parseFloat(updatedItem.current_quantity),
      minimum_quantity: parseFloat(updatedItem.minimum_quantity),
      unit_cost: parseFloat(updatedItem.unit_cost)
    };
  } catch (error) {
    console.error('Stock update failed:', error);
    throw error;
  }
};
