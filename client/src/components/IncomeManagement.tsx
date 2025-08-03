
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Income, CreateIncomeInput } from '../../../server/src/schema';

export function IncomeManagement() {
  const [income, setIncome] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateIncomeInput>({
    description: '',
    amount: 0,
    category: '',
    source: null,
    date: new Date()
  });

  const loadIncome = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getIncome.query();
      setIncome(result);
    } catch (error) {
      console.error('Failed to load income:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createIncome.mutate(formData);
      setIncome((prev: Income[]) => [response, ...prev]);
      setFormData({
        description: '',
        amount: 0,
        category: '',
        source: null,
        date: new Date()
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create income:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = income.reduce((sum: number, item: Income) => sum + item.amount, 0);
  const todayIncome = income
    .filter((item: Income) => new Date(item.date).toDateString() === new Date().toDateString())
    .reduce((sum: number, item: Income) => sum + item.amount, 0);

  if (isLoading && income.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading income records...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Income</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${todayIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Income Records</h3>
          <p className="text-gray-500">Track all incoming funds and revenue</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Income Record</DialogTitle>
              <DialogDescription>
                Record a new income transaction.
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
                      setFormData((prev: CreateIncomeInput) => ({ ...prev, description: e.target.value }))
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
                      setFormData((prev: CreateIncomeInput) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
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
                      setFormData((prev: CreateIncomeInput) => ({ ...prev, category: e.target.value }))
                    }
                    className="col-span-3"
                    placeholder="Sales, Services, etc."
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">Source</Label>
                  <Input
                    id="source"
                    value={formData.source || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIncomeInput) => ({
                        ...prev,
                        source: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                    placeholder="Customer, Partner, etc."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIncomeInput) => ({ ...prev, date: new Date(e.target.value) }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Income'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Income Table */}
      {income.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💰</span>
              <p className="text-gray-500">No income records yet. Add your first record above!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Income History</CardTitle>
            <CardDescription>
              All income transactions and revenue records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.map((item: Income) => (
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.source || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-green-600">
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
