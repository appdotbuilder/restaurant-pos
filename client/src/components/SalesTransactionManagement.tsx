
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SalesTransaction, MenuItem, CreateSalesTransactionInput, TransactionStatus } from '../../../server/src/schema';

export function SalesTransactionManagement() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateSalesTransactionInput>({
    customer_name: null,
    payment_method: '',
    discount_amount: 0,
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    menu_item_id: 0,
    quantity: 1
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [transactionsResult, menuItemsResult] = await Promise.all([
        trpc.getSalesTransactions.query(),
        trpc.getMenuItems.query()
      ]);
      setTransactions(transactionsResult);
      setMenuItems(menuItemsResult);
    } catch (error) {
      console.error('Failed to load transaction data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item to the transaction.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await trpc.createSalesTransaction.mutate(formData);
      setTransactions((prev: SalesTransaction[]) => [response, ...prev]);
      setFormData({
        customer_name: null,
        payment_method: '',
        discount_amount: 0,
        items: []
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItemToTransaction = () => {
    if (currentItem.menu_item_id === 0) return;
    
    const existingItemIndex = formData.items.findIndex(
      item => item.menu_item_id === currentItem.menu_item_id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += currentItem.quantity;
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...currentItem }]
      }));
    }
    
    setCurrentItem({ menu_item_id: 0, quantity: 1 });
  };

  const removeItemFromTransaction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getMenuItemName = (id: number) => {
    const item = menuItems.find(item => item.id === id);
    return item ? item.name : 'Unknown Item';
  };

  const getMenuItemPrice = (id: number) => {
    const item = menuItems.find(item => item.id === id);
    return item ? item.price : 0;
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const price = getMenuItemPrice(item.menu_item_id);
      return sum + (price * item.quantity);
    }, 0);
  };

  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'cancelled':
        return 'destructive' as const;
      case 'refunded':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const todayTransactions = transactions.filter(
    (transaction: SalesTransaction) => 
      new Date(transaction.created_at).toDateString() === new Date().toDateString()
  );

  const todayRevenue = todayTransactions
    .filter((transaction: SalesTransaction) => transaction.status === 'completed')
    .reduce((sum: number, transaction: SalesTransaction) => sum + transaction.final_amount, 0);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${todayRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sales Transactions</h3>
          <p className="text-gray-500">Process and manage sales orders</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>
                Process a new sales transaction.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Customer Info */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer_name" className="text-right">Customer</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSalesTransactionInput) => ({
                        ...prev,
                        customer_name: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                    placeholder="Customer name (optional)"
                  />
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment_method" className="text-right">Payment</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateSalesTransactionInput) => ({ ...prev, payment_method: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="digital">📱 Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Items Section */}
                <div className="space-y-2">
                  <Label>Add Items</Label>
                  <div className="flex gap-2">
                    <Select
                      value={currentItem.menu_item_id.toString()}
                      onValueChange={(value: string) =>
                        setCurrentItem(prev => ({ ...prev, menu_item_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item: MenuItem) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} - ${item.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                      }
                      className="w-20"
                    />
                    <Button type="button" onClick={addItemToTransaction}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div className="space-y-2">
                    <Label>Order Items</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="text-sm">
                            {getMenuItemName(item.menu_item_id)} x{item.quantity}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              ${(getMenuItemPrice(item.menu_item_id) * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItemFromTransaction(index)}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discount" className="text-right">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={calculateSubtotal()}
                    value={formData.discount_amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSalesTransactionInput) => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                  />
                </div>

                {/* Total */}
                {formData.items.length > 0 && (
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${(calculateSubtotal() - formData.discount_amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading || formData.items.length === 0}>
                  {isLoading ? 'Processing...' : 'Complete Sale'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🛒</span>
              <p className="text-gray-500">No transactions yet. Create your first sale above!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              All sales transactions and order history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: SalesTransaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium">{transaction.transaction_number}</div>
                    </TableCell>
                    <TableCell>
                      {transaction.customer_name || 'Walk-in Customer'}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{transaction.payment_method}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">
                        ${transaction.final_amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transaction.created_at.toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
