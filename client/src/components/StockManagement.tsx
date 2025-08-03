
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { StockItem, CreateStockItemInput, UpdateStockInput } from '../../../server/src/schema';

export function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const [formData, setFormData] = useState<CreateStockItemInput>({
    name: '',
    description: null,
    unit: '',
    current_quantity: 0,
    minimum_quantity: 0,
    unit_cost: 0,
    supplier: null
  });

  const [updateData, setUpdateData] = useState<UpdateStockInput>({
    id: 0,
    quantity_change: 0,
    unit_cost: undefined
  });

  const loadStockItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getStockItems.query();
      setStockItems(result);
    } catch (error) {
      console.error('Failed to load stock items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockItems();
  }, [loadStockItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createStockItem.mutate(formData);
      setStockItems((prev: StockItem[]) => [...prev, response]);
      setFormData({
        name: '',
        description: null,
        unit: '',
        current_quantity: 0,
        minimum_quantity: 0,
        unit_cost: 0,
        supplier: null
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create stock item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.updateStock.mutate(updateData);
      setStockItems((prev: StockItem[]) => 
        prev.map((item: StockItem) => 
          item.id === updateData.id ? response : item
        )
      );
      setUpdateDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateDialog = (item: StockItem) => {
    setSelectedItem(item);
    setUpdateData({
      id: item.id,
      quantity_change: 0,
      unit_cost: item.unit_cost
    });
    setUpdateDialogOpen(true);
  };

  const getStockStatus = (item: StockItem) => {
    if (item.current_quantity <= item.minimum_quantity) {
      return { status: 'Low Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (item.current_quantity <= item.minimum_quantity * 1.5) {
      return { status: 'Running Low', variant: 'secondary' as const, color: 'text-orange-600' };
    }
    return { status: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
  };

  if (isLoading && stockItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading stock items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Stock Management</h3>
          <p className="text-gray-500">Monitor and manage your inventory levels</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory tracking system.
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
                      setFormData((prev: CreateStockItemInput) => ({ ...prev, name: e.target.value }))
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
                      setFormData((prev: CreateStockItemInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateStockItemInput) => ({ ...prev, unit: e.target.value }))
                    }
                    className="col-span-3"
                    placeholder="kg, liter, pieces, etc."
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="current_quantity" className="text-right">Current Qty</Label>
                  <Input
                    id="current_quantity"
                    type="number"
                    min="0"
                    value={formData.current_quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateStockItemInput) => ({ ...prev, current_quantity: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minimum_quantity" className="text-right">Min Qty</Label>
                  <Input
                    id="minimum_quantity"
                    type="number"
                    min="0"
                    value={formData.minimum_quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateStockItemInput) => ({ ...prev, minimum_quantity: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit_cost" className="text-right">Unit Cost</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateStockItemInput) => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier" className="text-right">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateStockItemInput) => ({
                        ...prev,
                        supplier: e.target.value || null
                      }))
                    }
                    className="col-span-3"
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

      {/* Update Stock Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Stock: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Adjust the quantity and update unit cost if needed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStock}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Current Qty</Label>
                <div className="col-span-3 text-sm text-gray-600">
                  {selectedItem?.current_quantity} {selectedItem?.unit}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity_change" className="text-right">Quantity Change</Label>
                <Input
                  id="quantity_change"
                  type="number"
                  value={updateData.quantity_change}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateData((prev: UpdateStockInput) => ({ ...prev, quantity_change: parseFloat(e.target.value) || 0 }))
                  }
                  className="col-span-3"
                  placeholder="+ for add, - for remove"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_cost" className="text-right">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={updateData.unit_cost || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateData((prev: UpdateStockInput) => ({ ...prev, unit_cost: parseFloat(e.target.value) || undefined }))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Items Grid */}
      {stockItems.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">📦</span>
              <p className="text-gray-500">No stock items yet. Add your first item above!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockItems.map((item: StockItem) => {
            const stockStatus = getStockStatus(item);
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {item.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className={`font-bold ${stockStatus.color}`}>
                        {item.current_quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Minimum:</span>
                      <span className="font-medium">
                        {item.minimum_quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unit Cost:</span>
                      <span className="font-medium">
                        ${item.unit_cost.toFixed(2)}
                      </span>
                    </div>
                    {item.supplier && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Supplier:</span>
                        <span className="font-medium text-sm">
                          {item.supplier}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <Button
                        onClick={() => openUpdateDialog(item)}
                        className="w-full"
                        variant="outline"
                      >
                        Update Stock
                      </Button>
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.last_restocked_at ? (
                        <>Last restocked: {item.last_restocked_at.toLocaleDateString()}</>
                      ) : (
                        'Never restocked'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
