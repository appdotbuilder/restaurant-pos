
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { getStockReport } from '../handlers/get_stock_report';

describe('getStockReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty report when no stock items exist', async () => {
    const result = await getStockReport();

    expect(result.total_items).toEqual(0);
    expect(result.low_stock_items).toEqual([]);
    expect(result.stock_value).toEqual(0);
  });

  it('should calculate total items correctly', async () => {
    // Create test stock items
    await db.insert(stockItemsTable).values([
      {
        name: 'Test Item 1',
        unit: 'kg',
        current_quantity: '10.5',
        minimum_quantity: '5.0',
        unit_cost: '2.50'
      },
      {
        name: 'Test Item 2',
        unit: 'pieces',
        current_quantity: '20.0',
        minimum_quantity: '10.0',
        unit_cost: '1.00'
      }
    ]).execute();

    const result = await getStockReport();

    expect(result.total_items).toEqual(2);
  });

  it('should identify low stock items correctly', async () => {
    // Create stock items - some with low stock
    await db.insert(stockItemsTable).values([
      {
        name: 'Normal Stock Item',
        unit: 'kg',
        current_quantity: '15.0',
        minimum_quantity: '10.0',
        unit_cost: '2.00'
      },
      {
        name: 'Low Stock Item 1',
        unit: 'pieces',
        current_quantity: '3.0',
        minimum_quantity: '5.0',
        unit_cost: '1.50'
      },
      {
        name: 'Low Stock Item 2',
        unit: 'liter',
        current_quantity: '2.0',
        minimum_quantity: '8.0',
        unit_cost: '3.00'
      }
    ]).execute();

    const result = await getStockReport();

    expect(result.total_items).toEqual(3);
    expect(result.low_stock_items).toHaveLength(2);
    
    // Check low stock items details
    const lowStockNames = result.low_stock_items.map(item => item.name);
    expect(lowStockNames).toContain('Low Stock Item 1');
    expect(lowStockNames).toContain('Low Stock Item 2');
    expect(lowStockNames).not.toContain('Normal Stock Item');

    // Verify low stock item structure
    const lowStockItem1 = result.low_stock_items.find(item => item.name === 'Low Stock Item 1');
    expect(lowStockItem1).toBeDefined();
    expect(lowStockItem1!.current_quantity).toEqual(3);
    expect(lowStockItem1!.minimum_quantity).toEqual(5);
    expect(lowStockItem1!.status).toEqual('low_stock');
  });

  it('should calculate stock value correctly', async () => {
    // Create stock items with known quantities and costs
    await db.insert(stockItemsTable).values([
      {
        name: 'Item 1',
        unit: 'kg',
        current_quantity: '10.0', // 10 * 2.50 = 25.00
        minimum_quantity: '5.0',
        unit_cost: '2.50'
      },
      {
        name: 'Item 2',
        unit: 'pieces',
        current_quantity: '5.0', // 5 * 3.00 = 15.00
        minimum_quantity: '2.0',
        unit_cost: '3.00'
      },
      {
        name: 'Item 3',
        unit: 'liter',
        current_quantity: '2.5', // 2.5 * 4.00 = 10.00
        minimum_quantity: '1.0',
        unit_cost: '4.00'
      }
    ]).execute();

    const result = await getStockReport();

    // Total expected value: 25.00 + 15.00 + 10.00 = 50.00
    expect(result.stock_value).toEqual(50.00);
    expect(result.total_items).toEqual(3);
  });

  it('should handle decimal quantities and costs correctly', async () => {
    await db.insert(stockItemsTable).values([
      {
        name: 'Decimal Item',
        unit: 'kg',
        current_quantity: '3.75', // 3.75 * 1.33 = 4.9875
        minimum_quantity: '2.0',
        unit_cost: '1.33'
      }
    ]).execute();

    const result = await getStockReport();

    expect(result.stock_value).toBeCloseTo(4.9875, 4);
    expect(result.total_items).toEqual(1);
    expect(result.low_stock_items).toHaveLength(0);
  });

  it('should return correct report structure with mixed stock levels', async () => {
    await db.insert(stockItemsTable).values([
      {
        name: 'High Stock',
        unit: 'pieces',
        current_quantity: '100.0',
        minimum_quantity: '20.0',
        unit_cost: '0.50'
      },
      {
        name: 'Critical Stock',
        unit: 'kg',
        current_quantity: '1.0',
        minimum_quantity: '10.0',
        unit_cost: '5.00'
      }
    ]).execute();

    const result = await getStockReport();

    expect(result.total_items).toEqual(2);
    expect(result.low_stock_items).toHaveLength(1);
    expect(result.stock_value).toEqual(55.0); // (100 * 0.50) + (1 * 5.00)
    
    const criticalItem = result.low_stock_items[0];
    expect(criticalItem.name).toEqual('Critical Stock');
    expect(criticalItem.current_quantity).toEqual(1.0);
    expect(criticalItem.minimum_quantity).toEqual(10.0);
    expect(criticalItem.status).toEqual('low_stock');
  });
});
