
import { db } from '../db';
import { salesTransactionsTable, incomeTable, expensesTable } from '../db/schema';
import { type ReportPeriodInput, type ProfitLossReport } from '../schema';
import { and, gte, lte, eq, sum } from 'drizzle-orm';

export const getProfitLossReport = async (input: ReportPeriodInput): Promise<ProfitLossReport> => {
  try {
    const { start_date, end_date } = input;

    // Get total revenue from sales transactions (completed only)
    const salesRevenueResult = await db.select({
      total: sum(salesTransactionsTable.final_amount)
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

    // Get total income from other sources
    const otherIncomeResult = await db.select({
      total: sum(incomeTable.amount)
    })
    .from(incomeTable)
    .where(
      and(
        gte(incomeTable.date, start_date),
        lte(incomeTable.date, end_date)
      )
    )
    .execute();

    // Get total expenses
    const expensesResult = await db.select({
      total: sum(expensesTable.amount)
    })
    .from(expensesTable)
    .where(
      and(
        gte(expensesTable.date, start_date),
        lte(expensesTable.date, end_date)
      )
    )
    .execute();

    // Convert numeric values to numbers, handling null results
    const salesRevenue = salesRevenueResult[0]?.total ? parseFloat(salesRevenueResult[0].total) : 0;
    const otherIncome = otherIncomeResult[0]?.total ? parseFloat(otherIncomeResult[0].total) : 0;
    const totalExpenses = expensesResult[0]?.total ? parseFloat(expensesResult[0].total) : 0;

    // Calculate totals
    const totalRevenue = salesRevenue + otherIncome;
    const grossProfit = salesRevenue - totalExpenses; // Sales revenue minus expenses
    const netProfit = totalRevenue - totalExpenses; // All revenue minus expenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: `${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]}`,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      gross_profit: grossProfit,
      net_profit: netProfit,
      profit_margin: Math.round(profitMargin * 100) / 100 // Round to 2 decimal places
    };
  } catch (error) {
    console.error('Profit loss report generation failed:', error);
    throw error;
  }
};
