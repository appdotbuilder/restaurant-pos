
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema, 
  updateUserInputSchema,
  createMenuItemInputSchema,
  createStockItemInputSchema,
  updateStockInputSchema,
  createSalesTransactionInputSchema,
  createIncomeInputSchema,
  createExpenseInputSchema,
  reportPeriodInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { createMenuItem } from './handlers/create_menu_item';
import { getMenuItems } from './handlers/get_menu_items';
import { getMenuCategories } from './handlers/get_menu_categories';
import { createStockItem } from './handlers/create_stock_item';
import { getStockItems } from './handlers/get_stock_items';
import { updateStock } from './handlers/update_stock';
import { createSalesTransaction } from './handlers/create_sales_transaction';
import { getSalesTransactions } from './handlers/get_sales_transactions';
import { createIncome } from './handlers/create_income';
import { getIncome } from './handlers/get_income';
import { createExpense } from './handlers/create_expense';
import { getExpenses } from './handlers/get_expenses';
import { getSalesReport } from './handlers/get_sales_report';
import { getStockReport } from './handlers/get_stock_report';
import { getProfitLossReport } from './handlers/get_profit_loss_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User Management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Menu Management
  createMenuItem: publicProcedure
    .input(createMenuItemInputSchema)
    .mutation(({ input }) => createMenuItem(input)),
  getMenuItems: publicProcedure
    .query(() => getMenuItems()),
  getMenuCategories: publicProcedure
    .query(() => getMenuCategories()),

  // Stock Management
  createStockItem: publicProcedure
    .input(createStockItemInputSchema)
    .mutation(({ input }) => createStockItem(input)),
  getStockItems: publicProcedure
    .query(() => getStockItems()),
  updateStock: publicProcedure
    .input(updateStockInputSchema)
    .mutation(({ input }) => updateStock(input)),

  // Sales Transactions
  createSalesTransaction: publicProcedure
    .input(createSalesTransactionInputSchema)
    .mutation(({ input }) => createSalesTransaction(input)),
  getSalesTransactions: publicProcedure
    .query(() => getSalesTransactions()),

  // Income Management
  createIncome: publicProcedure
    .input(createIncomeInputSchema)
    .mutation(({ input }) => createIncome(input)),
  getIncome: publicProcedure
    .query(() => getIncome()),

  // Expense Management
  createExpense: publicProcedure
    .input(createExpenseInputSchema)
    .mutation(({ input }) => createExpense(input)),
  getExpenses: publicProcedure
    .query(() => getExpenses()),

  // Reports
  getSalesReport: publicProcedure
    .input(reportPeriodInputSchema)
    .query(({ input }) => getSalesReport(input)),
  getStockReport: publicProcedure
    .query(() => getStockReport()),
  getProfitLossReport: publicProcedure
    .input(reportPeriodInputSchema)
    .query(({ input }) => getProfitLossReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
