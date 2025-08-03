
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuCategoriesTable } from '../db/schema';
import { getMenuCategories } from '../handlers/get_menu_categories';

describe('getMenuCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active menu categories', async () => {
    // Create active categories
    await db.insert(menuCategoriesTable)
      .values([
        {
          name: 'Appetizers',
          description: 'Start your meal right',
          is_active: true
        },
        {
          name: 'Main Courses',
          description: 'Hearty meals',
          is_active: true
        }
      ])
      .execute();

    const result = await getMenuCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Appetizers');
    expect(result[0].description).toEqual('Start your meal right');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].name).toEqual('Main Courses');
    expect(result[1].description).toEqual('Hearty meals');
    expect(result[1].is_active).toBe(true);
  });

  it('should not return inactive categories', async () => {
    // Create active and inactive categories
    await db.insert(menuCategoriesTable)
      .values([
        {
          name: 'Active Category',
          description: 'This is active',
          is_active: true
        },
        {
          name: 'Inactive Category', 
          description: 'This is inactive',
          is_active: false
        }
      ])
      .execute();

    const result = await getMenuCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Category');
    expect(result[0].is_active).toBe(true);
  });

  it('should return empty array when no active categories exist', async () => {
    // Create only inactive category
    await db.insert(menuCategoriesTable)
      .values({
        name: 'Inactive Category',
        description: 'Not active',
        is_active: false
      })
      .execute();

    const result = await getMenuCategories();

    expect(result).toHaveLength(0);
  });

  it('should handle categories with null descriptions', async () => {
    await db.insert(menuCategoriesTable)
      .values({
        name: 'No Description Category',
        description: null,
        is_active: true
      })
      .execute();

    const result = await getMenuCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('No Description Category');
    expect(result[0].description).toBeNull();
    expect(result[0].is_active).toBe(true);
  });
});
