
import { db } from '../db';
import { stockItemsTable } from '../db/schema';
import { type StockReport } from '../schema';
import { lt, sum, count } from 'drizzle-orm';

export const getStockReport = async (): Promise<StockReport> => {
  try {
    // Get total count of stock items
    const totalItemsResult = await db.select({
      total: count()
    })
      .from(stockItemsTable)
      .execute();

    const totalItems = totalItemsResult[0]?.total || 0;

    // Get items with low stock (current_quantity < minimum_quantity)
    const lowStockItems = await db.select({
      name: stockItemsTable.name,
      current_quantity: stockItemsTable.current_quantity,
      minimum_quantity: stockItemsTable.minimum_quantity
    })
      .from(stockItemsTable)
      .where(lt(stockItemsTable.current_quantity, stockItemsTable.minimum_quantity))
      .execute();

    // Calculate total stock value (current_quantity * unit_cost for all items)
    const stockValueResult = await db.select({
      total_value: sum(stockItemsTable.current_quantity)
    })
      .from(stockItemsTable)
      .execute();

    // Since we can't multiply in the query directly, we need to get all items and calculate
    const allItems = await db.select({
      current_quantity: stockItemsTable.current_quantity,
      unit_cost: stockItemsTable.unit_cost
    })
      .from(stockItemsTable)
      .execute();

    const stockValue = allItems.reduce((total, item) => {
      const quantity = parseFloat(item.current_quantity);
      const cost = parseFloat(item.unit_cost);
      return total + (quantity * cost);
    }, 0);

    // Format low stock items for response
    const formattedLowStockItems = lowStockItems.map(item => ({
      name: item.name,
      current_quantity: parseFloat(item.current_quantity),
      minimum_quantity: parseFloat(item.minimum_quantity),
      status: 'low_stock'
    }));

    return {
      total_items: totalItems,
      low_stock_items: formattedLowStockItems,
      stock_value: stockValue
    };
  } catch (error) {
    console.error('Stock report generation failed:', error);
    throw error;
  }
};
