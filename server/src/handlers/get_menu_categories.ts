
import { db } from '../db';
import { menuCategoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type MenuCategory } from '../schema';

export const getMenuCategories = async (): Promise<MenuCategory[]> => {
  try {
    const results = await db.select()
      .from(menuCategoriesTable)
      .where(eq(menuCategoriesTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch menu categories:', error);
    throw error;
  }
};
