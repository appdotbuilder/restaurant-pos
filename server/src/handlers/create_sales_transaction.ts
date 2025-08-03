
import { db } from '../db';
import { salesTransactionsTable, salesTransactionItemsTable, menuItemsTable, stockItemsTable } from '../db/schema';
import { type CreateSalesTransactionInput, type SalesTransaction } from '../schema';
import { eq, inArray } from 'drizzle-orm';

const TAX_RATE = 0.08; // 8% tax rate

export const createSalesTransaction = async (input: CreateSalesTransactionInput): Promise<SalesTransaction> => {
  try {
    // Generate unique transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get all menu items for the transaction in one query
    const menuItemIds = input.items.map(item => item.menu_item_id);
    const allMenuItems = await db.select()
      .from(menuItemsTable)
      .where(inArray(menuItemsTable.id, menuItemIds))
      .execute();
    
    // Validate all menu items exist and are available
    for (const inputItem of input.items) {
      const menuItem = allMenuItems.find(m => m.id === inputItem.menu_item_id);
      
      if (!menuItem) {
        throw new Error(`Menu item with id ${inputItem.menu_item_id} not found`);
      }
      
      if (!menuItem.is_available) {
        throw new Error(`Menu item "${menuItem.name}" is not available`);
      }
    }

    // Validate stock availability for items that have stock tracking
    const stockItems = await db.select()
      .from(stockItemsTable)
      .execute();
    
    const stockMap = new Map(stockItems.map(item => [item.name.toLowerCase(), item]));
    
    for (const inputItem of input.items) {
      const menuItem = allMenuItems.find(m => m.id === inputItem.menu_item_id);
      if (menuItem) {
        const stockItem = stockMap.get(menuItem.name.toLowerCase());
        if (stockItem && parseFloat(stockItem.current_quantity) < inputItem.quantity) {
          throw new Error(`Insufficient stock for "${menuItem.name}". Available: ${stockItem.current_quantity}, Requested: ${inputItem.quantity}`);
        }
      }
    }

    // Calculate totals
    let totalAmount = 0;
    const transactionItems = [];

    for (const inputItem of input.items) {
      const menuItem = allMenuItems.find(m => m.id === inputItem.menu_item_id);
      if (!menuItem) continue;

      const unitPrice = parseFloat(menuItem.price);
      const totalPrice = unitPrice * inputItem.quantity;
      totalAmount += totalPrice;

      transactionItems.push({
        menu_item_id: inputItem.menu_item_id,
        quantity: inputItem.quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      });
    }

    const taxAmount = totalAmount * TAX_RATE;
    const finalAmount = totalAmount + taxAmount - input.discount_amount;

    // Create the sales transaction
    const transactionResult = await db.insert(salesTransactionsTable)
      .values({
        transaction_number: transactionNumber,
        customer_name: input.customer_name,
        total_amount: totalAmount.toString(),
        tax_amount: taxAmount.toString(),
        discount_amount: input.discount_amount.toString(),
        final_amount: finalAmount.toString(),
        payment_method: input.payment_method,
        status: 'completed',
        cashier_id: 1, // Fixed cashier ID for now
        completed_at: new Date()
      })
      .returning()
      .execute();

    const transaction = transactionResult[0];

    // Create transaction items
    for (const item of transactionItems) {
      await db.insert(salesTransactionItemsTable)
        .values({
          transaction_id: transaction.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price.toString(),
          total_price: item.total_price.toString()
        })
        .execute();
    }

    // Update stock quantities for items that have stock tracking
    for (const inputItem of input.items) {
      const menuItem = allMenuItems.find(m => m.id === inputItem.menu_item_id);
      if (menuItem) {
        const stockItem = stockMap.get(menuItem.name.toLowerCase());
        if (stockItem) {
          const newQuantity = parseFloat(stockItem.current_quantity) - inputItem.quantity;
          await db.update(stockItemsTable)
            .set({
              current_quantity: newQuantity.toString(),
              last_restocked_at: stockItem.last_restocked_at // Preserve existing value
            })
            .where(eq(stockItemsTable.id, stockItem.id))
            .execute();
        }
      }
    }

    // Return the transaction with converted numeric fields
    return {
      ...transaction,
      total_amount: parseFloat(transaction.total_amount),
      tax_amount: parseFloat(transaction.tax_amount),
      discount_amount: parseFloat(transaction.discount_amount),
      final_amount: parseFloat(transaction.final_amount)
    };
  } catch (error) {
    console.error('Sales transaction creation failed:', error);
    throw error;
  }
};
