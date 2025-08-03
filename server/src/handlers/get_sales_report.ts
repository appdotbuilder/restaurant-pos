
import { db } from '../db';
import { salesTransactionsTable, salesTransactionItemsTable, menuItemsTable } from '../db/schema';
import { type ReportPeriodInput, type SalesReport } from '../schema';
import { eq, and, gte, lte, desc, sum, count, sql } from 'drizzle-orm';

export async function getSalesReport(input: ReportPeriodInput): Promise<SalesReport> {
  try {
    const { start_date, end_date } = input;

    // Get total sales and transaction count for the period
    const salesSummary = await db
      .select({
        total_sales: sum(salesTransactionsTable.final_amount),
        total_transactions: count(salesTransactionsTable.id)
      })
      .from(salesTransactionsTable)
      .where(
        and(
          eq(salesTransactionsTable.status, 'completed'),
          gte(salesTransactionsTable.completed_at, start_date),
          lte(salesTransactionsTable.completed_at, end_date)
        )
      )
      .execute();

    const summary = salesSummary[0];
    const totalSales = summary.total_sales ? parseFloat(summary.total_sales) : 0;
    const totalTransactions = summary.total_transactions || 0;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Get top-selling items with quantities and revenue
    const topSellingItems = await db
      .select({
        item_name: menuItemsTable.name,
        quantity_sold: sum(salesTransactionItemsTable.quantity),
        revenue: sum(salesTransactionItemsTable.total_price)
      })
      .from(salesTransactionItemsTable)
      .innerJoin(
        salesTransactionsTable,
        eq(salesTransactionItemsTable.transaction_id, salesTransactionsTable.id)
      )
      .innerJoin(
        menuItemsTable,
        eq(salesTransactionItemsTable.menu_item_id, menuItemsTable.id)
      )
      .where(
        and(
          eq(salesTransactionsTable.status, 'completed'),
          gte(salesTransactionsTable.completed_at, start_date),
          lte(salesTransactionsTable.completed_at, end_date)
        )
      )
      .groupBy(menuItemsTable.id, menuItemsTable.name)
      .orderBy(desc(sum(salesTransactionItemsTable.quantity)))
      .limit(10)
      .execute();

    return {
      period: `${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]}`,
      total_sales: totalSales,
      total_transactions: totalTransactions,
      average_transaction: Math.round(averageTransaction * 100) / 100, // Round to 2 decimal places
      top_selling_items: topSellingItems.map(item => ({
        item_name: item.item_name,
        quantity_sold: typeof item.quantity_sold === 'string' ? parseInt(item.quantity_sold) : (item.quantity_sold || 0),
        revenue: item.revenue ? parseFloat(item.revenue) : 0
      }))
    };
  } catch (error) {
    console.error('Sales report generation failed:', error);
    throw error;
  }
}
