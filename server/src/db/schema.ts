
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'cashier', 'staff']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'cancelled', 'refunded']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Menu categories table
export const menuCategoriesTable = pgTable('menu_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Menu items table
export const menuItemsTable = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category_id: integer('category_id').notNull(),
  is_available: boolean('is_available').default(true).notNull(),
  preparation_time: integer('preparation_time').notNull(), // in minutes
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Stock items table
export const stockItemsTable = pgTable('stock_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').notNull(), // kg, liter, pieces, etc.
  current_quantity: numeric('current_quantity', { precision: 10, scale: 3 }).notNull(),
  minimum_quantity: numeric('minimum_quantity', { precision: 10, scale: 3 }).notNull(),
  unit_cost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
  supplier: text('supplier'),
  last_restocked_at: timestamp('last_restocked_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Sales transactions table
export const salesTransactionsTable = pgTable('sales_transactions', {
  id: serial('id').primaryKey(),
  transaction_number: text('transaction_number').notNull().unique(),
  customer_name: text('customer_name'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  tax_amount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  final_amount: numeric('final_amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: text('payment_method').notNull(),
  status: transactionStatusEnum('status').notNull(),
  cashier_id: integer('cashier_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
});

// Sales transaction items table
export const salesTransactionItemsTable = pgTable('sales_transaction_items', {
  id: serial('id').primaryKey(),
  transaction_id: integer('transaction_id').notNull(),
  menu_item_id: integer('menu_item_id').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

// Income table
export const incomeTable = pgTable('income', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  source: text('source'),
  date: timestamp('date').notNull(),
  recorded_by: integer('recorded_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  vendor: text('vendor'),
  receipt_number: text('receipt_number'),
  date: timestamp('date').notNull(),
  recorded_by: integer('recorded_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  sales_transactions: many(salesTransactionsTable),
  income_records: many(incomeTable),
  expense_records: many(expensesTable),
}));

export const menuCategoriesRelations = relations(menuCategoriesTable, ({ many }) => ({
  menu_items: many(menuItemsTable),
}));

export const menuItemsRelations = relations(menuItemsTable, ({ one, many }) => ({
  category: one(menuCategoriesTable, {
    fields: [menuItemsTable.category_id],
    references: [menuCategoriesTable.id],
  }),
  transaction_items: many(salesTransactionItemsTable),
}));

export const salesTransactionsRelations = relations(salesTransactionsTable, ({ one, many }) => ({
  cashier: one(usersTable, {
    fields: [salesTransactionsTable.cashier_id],
    references: [usersTable.id],
  }),
  items: many(salesTransactionItemsTable),
}));

export const salesTransactionItemsRelations = relations(salesTransactionItemsTable, ({ one }) => ({
  transaction: one(salesTransactionsTable, {
    fields: [salesTransactionItemsTable.transaction_id],
    references: [salesTransactionsTable.id],
  }),
  menu_item: one(menuItemsTable, {
    fields: [salesTransactionItemsTable.menu_item_id],
    references: [menuItemsTable.id],
  }),
}));

export const incomeRelations = relations(incomeTable, ({ one }) => ({
  recorded_by_user: one(usersTable, {
    fields: [incomeTable.recorded_by],
    references: [usersTable.id],
  }),
}));

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  recorded_by_user: one(usersTable, {
    fields: [expensesTable.recorded_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  menuCategories: menuCategoriesTable,
  menuItems: menuItemsTable,
  stockItems: stockItemsTable,
  salesTransactions: salesTransactionsTable,
  salesTransactionItems: salesTransactionItemsTable,
  income: incomeTable,
  expenses: expensesTable,
};
