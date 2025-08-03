
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type CreateMenuItemInput, type MenuItem } from '../schema';

export const createMenuItem = async (input: CreateMenuItemInput): Promise<MenuItem> => {
  try {
    // Insert menu item record
    const result = await db.insert(menuItemsTable)
      .values({
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        category_id: input.category_id,
        preparation_time: input.preparation_time, // Integer column - no conversion needed
        image_url: input.image_url
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const menuItem = result[0];
    return {
      ...menuItem,
      price: parseFloat(menuItem.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Menu item creation failed:', error);
    throw error;
  }
};
