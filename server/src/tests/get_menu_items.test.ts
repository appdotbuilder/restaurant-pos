
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuCategoriesTable, menuItemsTable } from '../db/schema';
import { getMenuItems } from '../handlers/get_menu_items';

describe('getMenuItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no menu items exist', async () => {
    const result = await getMenuItems();
    expect(result).toEqual([]);
  });

  it('should return all menu items', async () => {
    // Create a test category first
    const categoryResult = await db.insert(menuCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test menu items
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Test Item 1',
          description: 'First test item',
          price: '12.99',
          category_id: categoryId,
          preparation_time: 15,
          image_url: 'http://example.com/image1.jpg'
        },
        {
          name: 'Test Item 2',
          description: 'Second test item',
          price: '8.50',
          category_id: categoryId,
          preparation_time: 10,
          image_url: null
        }
      ])
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test Item 1');
    expect(result[0].description).toEqual('First test item');
    expect(result[0].price).toEqual(12.99);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].category_id).toEqual(categoryId);
    expect(result[0].is_available).toBe(true);
    expect(result[0].preparation_time).toEqual(15);
    expect(result[0].image_url).toEqual('http://example.com/image1.jpg');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Test Item 2');
    expect(result[1].price).toEqual(8.50);
    expect(typeof result[1].price).toBe('number');
    expect(result[1].image_url).toBeNull();
  });

  it('should return items with correct data types', async () => {
    // Create a test category
    const categoryResult = await db.insert(menuCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create a test menu item
    await db.insert(menuItemsTable)
      .values({
        name: 'Type Test Item',
        description: 'Item for type testing',
        price: '25.75',
        category_id: categoryResult[0].id,
        preparation_time: 20,
        is_available: false
      })
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(1);
    const item = result[0];

    // Verify all field types
    expect(typeof item.id).toBe('number');
    expect(typeof item.name).toBe('string');
    expect(typeof item.description).toBe('string');
    expect(typeof item.price).toBe('number');
    expect(typeof item.category_id).toBe('number');
    expect(typeof item.is_available).toBe('boolean');
    expect(typeof item.preparation_time).toBe('number');
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(item.price).toEqual(25.75);
    expect(item.is_available).toBe(false);
  });
});
