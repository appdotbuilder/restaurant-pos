
import { z } from 'zod';

// User Management Schemas
export const userRoleEnum = z.enum(['admin', 'manager', 'cashier', 'staff']);
export type UserRole = z.infer<typeof userRoleEnum>;

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: userRoleEnum.optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Menu Management Schemas
export const menuCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type MenuCategory = z.infer<typeof menuCategorySchema>;

export const menuItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  category_id: z.number(),
  is_available: z.boolean(),
  preparation_time: z.number().int(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MenuItem = z.infer<typeof menuItemSchema>;

export const createMenuItemInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  category_id: z.number(),
  preparation_time: z.number().int().nonnegative(),
  image_url: z.string().nullable()
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;

// Stock Management Schemas
export const stockItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string(), // kg, liter, pieces, etc.
  current_quantity: z.number(),
  minimum_quantity: z.number(),
  unit_cost: z.number(),
  supplier: z.string().nullable(),
  last_restocked_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type StockItem = z.infer<typeof stockItemSchema>;

export const createStockItemInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  unit: z.string(),
  current_quantity: z.number().nonnegative(),
  minimum_quantity: z.number().nonnegative(),
  unit_cost: z.number().positive(),
  supplier: z.string().nullable()
});

export type CreateStockItemInput = z.infer<typeof createStockItemInputSchema>;

export const updateStockInputSchema = z.object({
  id: z.number(),
  quantity_change: z.number(),
  unit_cost: z.number().positive().optional()
});

export type UpdateStockInput = z.infer<typeof updateStockInputSchema>;

// Sales Transaction Schemas
export const transactionStatusEnum = z.enum(['pending', 'completed', 'cancelled', 'refunded']);
export type TransactionStatus = z.infer<typeof transactionStatusEnum>;

export const salesTransactionSchema = z.object({
  id: z.number(),
  transaction_number: z.string(),
  customer_name: z.string().nullable(),
  total_amount: z.number(),
  tax_amount: z.number(),
  discount_amount: z.number(),
  final_amount: z.number(),
  payment_method: z.string(),
  status: transactionStatusEnum,
  cashier_id: z.number(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type SalesTransaction = z.infer<typeof salesTransactionSchema>;

export const salesTransactionItemSchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  menu_item_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number()
});

export type SalesTransactionItem = z.infer<typeof salesTransactionItemSchema>;

export const createSalesTransactionInputSchema = z.object({
  customer_name: z.string().nullable(),
  payment_method: z.string(),
  discount_amount: z.number().nonnegative(),
  items: z.array(z.object({
    menu_item_id: z.number(),
    quantity: z.number().int().positive()
  }))
});

export type CreateSalesTransactionInput = z.infer<typeof createSalesTransactionInputSchema>;

// Income Management Schemas
export const incomeSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  source: z.string().nullable(),
  date: z.coerce.date(),
  recorded_by: z.number(),
  created_at: z.coerce.date()
});

export type Income = z.infer<typeof incomeSchema>;

export const createIncomeInputSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string(),
  source: z.string().nullable(),
  date: z.coerce.date()
});

export type CreateIncomeInput = z.infer<typeof createIncomeInputSchema>;

// Expense Management Schemas
export const expenseSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  vendor: z.string().nullable(),
  receipt_number: z.string().nullable(),
  date: z.coerce.date(),
  recorded_by: z.number(),
  created_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string(),
  vendor: z.string().nullable(),
  receipt_number: z.string().nullable(),
  date: z.coerce.date()
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// Report Schemas
export const salesReportSchema = z.object({
  period: z.string(),
  total_sales: z.number(),
  total_transactions: z.number(),
  average_transaction: z.number(),
  top_selling_items: z.array(z.object({
    item_name: z.string(),
    quantity_sold: z.number(),
    revenue: z.number()
  }))
});

export type SalesReport = z.infer<typeof salesReportSchema>;

export const stockReportSchema = z.object({
  total_items: z.number(),
  low_stock_items: z.array(z.object({
    name: z.string(),
    current_quantity: z.number(),
    minimum_quantity: z.number(),
    status: z.string()
  })),
  stock_value: z.number()
});

export type StockReport = z.infer<typeof stockReportSchema>;

export const profitLossReportSchema = z.object({
  period: z.string(),
  total_revenue: z.number(),
  total_expenses: z.number(),
  gross_profit: z.number(),
  net_profit: z.number(),
  profit_margin: z.number()
});

export type ProfitLossReport = z.infer<typeof profitLossReportSchema>;

export const reportPeriodInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type ReportPeriodInput = z.infer<typeof reportPeriodInputSchema>;
