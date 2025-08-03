
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Expense, CreateExpenseInput } from '../../../server/src/schema';

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateExpenseInput>({
    description: '',
    amount: 0,
    category: '',
    vendor: null,
    receipt_number: null,
    date: new Date()
  });

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getExpenses.query();
      setExpenses(result);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createExpense.mutate(formData);
      setExpenses((prev: Expense[]) => [response, ...prev]);
      setFormData({
        description: '',
        amount: 0,
        category: '',
        vendor: null,
        receipt_number: null,
        date: new Date()
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum: number, item: Expense) => sum + item.amount, 0);
  const todayExpenses = expenses
    .filter((item: Expense) => new Date(item.date).toDateString() === new Date().toDateString())
    .reduce((sum: number, item: Expense) => sum + item.amount, 0);

  if (isLoading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading expense records...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${todayExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="text-2xl">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expense Records</h3>
          <p className="text-gray-500">Track all outgoing funds and costs</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Expense Record</DialogTitle>
              <DialogDescription>
                Record a new expense transaction.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ ...prev, description: e.target.value }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ ...prev, category: e.target.value }))
                    }
                    className="col-span-3"
                    placeholder="Supplies, Utilities, etc."
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor" className="text-right">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({
                        ...prev,
                        vendor: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                    placeholder="Supplier name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receipt_number" className="text-right">Receipt #</Label>
                  <Input
                    id="receipt_number"
                    value={formData.receipt_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({
                        ...prev,
                        receipt_number: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                    placeholder="Receipt number"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateExpenseInput) => ({ ...prev, date: new Date(e.target.value) }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💸</span>
              <p className="text-gray-500">No expense records yet. Add your first record above!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>
              All expense transactions and cost records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item: Expense) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm">
                        {item.date.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.vendor || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.receipt_number || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-red-600">
                        ${item.amount.toFixed(2)}
                      </span>
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
