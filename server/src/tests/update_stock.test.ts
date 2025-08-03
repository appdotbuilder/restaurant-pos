
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type UpdateStockInput, type CreateStockItemInput } from '../schema';
import { updateStock } from '../handlers/update_stock';
import { eq } from 'drizzle-orm';

// Helper function to create a test stock item
const createTestStockItem = async (overrides: Partial<CreateStockItemInput> = {}) => {
  const defaultInput: CreateStockItemInput = {
    name: 'Test Stock Item',
    description: 'A test stock item',
    unit: 'kg',
    current_quantity: 100,
    minimum_quantity: 10,
    unit_cost: 5.50,
    supplier: 'Test Supplier'
  };

  const input = { ...defaultInput, ...overrides };

  const result = await db.insert(stockItemsTable)
    .values({
      name: input.name,
      description: input.description,
      unit: input.unit,
      current_quantity: input.current_quantity.toString(),
      minimum_quantity: input.minimum_quantity.toString(),
      unit_cost: input.unit_cost.toString(),
      supplier: input.supplier
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateStock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should increase stock quantity', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 50 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: 25
    };

    const result = await updateStock(updateInput);

    expect(result.id).toEqual(stockItem.id);
    expect(result.current_quantity).toEqual(75);
    expect(result.name).toEqual('Test Stock Item');
    expect(result.unit_cost).toEqual(5.50);
    expect(result.last_restocked_at).toBeInstanceOf(Date);
  });

  it('should decrease stock quantity', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 100 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: -30
    };

    const result = await updateStock(updateInput);

    expect(result.id).toEqual(stockItem.id);
    expect(result.current_quantity).toEqual(70);
    expect(result.last_restocked_at).toBeNull(); // Should not update timestamp for decrease
  });

  it('should update unit cost when provided', async () => {
    const stockItem = await createTestStockItem({ unit_cost: 5.00 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: 0,
      unit_cost: 7.25
    };

    const result = await updateStock(updateInput);

    expect(result.id).toEqual(stockItem.id);
    expect(result.current_quantity).toEqual(100); // No quantity change
    expect(result.unit_cost).toEqual(7.25);
  });

  it('should update both quantity and unit cost', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 80, unit_cost: 4.00 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: 20,
      unit_cost: 6.50
    };

    const result = await updateStock(updateInput);

    expect(result.id).toEqual(stockItem.id);
    expect(result.current_quantity).toEqual(100);
    expect(result.unit_cost).toEqual(6.50);
    expect(result.last_restocked_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 60 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: 15,
      unit_cost: 8.00
    };

    await updateStock(updateInput);

    // Verify changes are persisted in database
    const updatedItems = await db.select()
      .from(stockItemsTable)
      .where(eq(stockItemsTable.id, stockItem.id))
      .execute();

    expect(updatedItems).toHaveLength(1);
    const updatedItem = updatedItems[0];
    expect(parseFloat(updatedItem.current_quantity)).toEqual(75);
    expect(parseFloat(updatedItem.unit_cost)).toEqual(8.00);
    expect(updatedItem.last_restocked_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent stock item', async () => {
    const updateInput: UpdateStockInput = {
      id: 99999,
      quantity_change: 10
    };

    await expect(updateStock(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when trying to create negative stock', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 20 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: -30
    };

    await expect(updateStock(updateInput)).rejects.toThrow(/insufficient stock/i);
  });

  it('should handle zero quantity change', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 50 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: 0
    };

    const result = await updateStock(updateInput);

    expect(result.current_quantity).toEqual(50);
    expect(result.last_restocked_at).toBeNull(); // Should not update timestamp for zero change
  });

  it('should handle decimal quantities correctly', async () => {
    const stockItem = await createTestStockItem({ current_quantity: 25.5 });

    const updateInput: UpdateStockInput = {
      id: stockItem.id,
      quantity_change: 12.25
    };

    const result = await updateStock(updateInput);

    expect(result.current_quantity).toEqual(37.75);
    expect(typeof result.current_quantity).toEqual('number');
  });
});
