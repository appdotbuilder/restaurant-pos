
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { MenuItem, MenuCategory, CreateMenuItemInput } from '../../../server/src/schema';

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateMenuItemInput>({
    name: '',
    description: null,
    price: 0,
    category_id: 0,
    preparation_time: 0,
    image_url: null
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [itemsResult, categoriesResult] = await Promise.all([
        trpc.getMenuItems.query(),
        trpc.getMenuCategories.query()
      ]);
      setMenuItems(itemsResult);
      setCategories(categoriesResult);
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createMenuItem.mutate(formData);
      setMenuItems((prev: MenuItem[]) => [...prev, response]);
      setFormData({
        name: '',
        description: null,
        price: 0,
        category_id: 0,
        preparation_time: 0,
        image_url: null
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create menu item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  if (isLoading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading menu items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Menu Items</h3>
          <p className="text-gray-500">Manage your restaurant menu and pricing</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Create a new item for your restaurant menu.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Select
                    value={formData.category_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateMenuItemInput) => ({ ...prev, category_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: MenuCategory) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prep_time" className="text-right">Prep Time (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    min="0"
                    value={formData.preparation_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({ ...prev, preparation_time: parseInt(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image_url" className="text-right">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({
                        ...prev,
                        image_url: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Items Grid */}
      {menuItems.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🍽️</span>
              <p className="text-gray-500">No menu items yet. Add your first item above!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item: MenuItem) => (
            <Card key={item.id} className="overflow-hidden">
              {item.image_url && (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant={item.is_available ? 'default' : 'secondary'}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                <CardDescription>
                  {getCategoryName(item.category_id)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.description && (
                  <p className="text-gray-600 mb-3">{item.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className="text-sm text-gray-500">
                    ⏱️ {item.preparation_time} min
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Added: {item.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
