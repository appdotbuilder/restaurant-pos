
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable, menuCategoriesTable } from '../db/schema';
import { type CreateMenuItemInput } from '../schema';
import { createMenuItem } from '../handlers/create_menu_item';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateMenuItemInput = {
  name: 'Test Burger',
  description: 'A delicious test burger',
  price: 12.99,
  category_id: 1,
  preparation_time: 15,
  image_url: 'https://example.com/burger.jpg'
};

describe('createMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a menu item', async () => {
    // Create prerequisite category first
    await db.insert(menuCategoriesTable)
      .values({
        name: 'Main Dishes',
        description: 'Main course items'
      })
      .execute();

    const result = await createMenuItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Burger');
    expect(result.description).toEqual(testInput.description);
    expect(result.price).toEqual(12.99);
    expect(typeof result.price).toEqual('number');
    expect(result.category_id).toEqual(1);
    expect(result.is_available).toEqual(true);
    expect(result.preparation_time).toEqual(15);
    expect(result.image_url).toEqual(testInput.image_url);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save menu item to database', async () => {
    // Create prerequisite category first
    await db.insert(menuCategoriesTable)
      .values({
        name: 'Main Dishes',
        description: 'Main course items'
      })
      .execute();

    const result = await createMenuItem(testInput);

    // Query using proper drizzle syntax
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, result.id))
      .execute();

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0].name).toEqual('Test Burger');
    expect(menuItems[0].description).toEqual(testInput.description);
    expect(parseFloat(menuItems[0].price)).toEqual(12.99);
    expect(menuItems[0].category_id).toEqual(1);
    expect(menuItems[0].is_available).toEqual(true);
    expect(menuItems[0].preparation_time).toEqual(15);
    expect(menuItems[0].image_url).toEqual(testInput.image_url);
    expect(menuItems[0].created_at).toBeInstanceOf(Date);
    expect(menuItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description and image_url', async () => {
    // Create prerequisite category first
    await db.insert(menuCategoriesTable)
      .values({
        name: 'Main Dishes',
        description: 'Main course items'
      })
      .execute();

    const inputWithNulls: CreateMenuItemInput = {
      name: 'Simple Item',
      description: null,
      price: 8.50,
      category_id: 1,
      preparation_time: 10,
      image_url: null
    };

    const result = await createMenuItem(inputWithNulls);

    expect(result.name).toEqual('Simple Item');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(8.50);
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should create menu item with any category_id value', async () => {
    // Test that menu items can be created with any category_id
    // (since there are no foreign key constraints in the schema)
    const inputWithAnyCategory: CreateMenuItemInput = {
      name: 'Any Category Item',
      description: 'Item with arbitrary category',
      price: 5.99,
      category_id: 999, // Any number should work
      preparation_time: 5,
      image_url: null
    };

    const result = await createMenuItem(inputWithAnyCategory);

    expect(result.name).toEqual('Any Category Item');
    expect(result.category_id).toEqual(999);
    expect(result.price).toEqual(5.99);
    expect(result.id).toBeDefined();

    // Verify it was saved to database
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, result.id))
      .execute();

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0].category_id).toEqual(999);
  });
});
