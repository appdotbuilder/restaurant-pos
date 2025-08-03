
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { StockReport } from '../../../server/src/schema';

export function StockReports() {
  const [report, setReport] = useState<StockReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getStockReport.query();
      setReport(result);
    } catch (error) {
      console.error('Failed to generate stock report:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const getStockStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical':
        return 'destructive' as const;
      case 'low':
        return 'secondary' as const;
      case 'adequate':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'low':
        return '⚠️';
      case 'adequate':
        return '✅';
      default:
        return '📦';
    }
  };

  if (isLoading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Generating stock report...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Stock Reports</h3>
          <p className="text-gray-500">Monitor inventory levels and stock status</p>
        </div>
        <Button onClick={generateReport} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : '🔄 Refresh Report'}
        </Button>
      </div>

      {report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <span className="text-2xl">📦</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.total_items}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inventory items tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <span className="text-2xl">⚠️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {report.low_stock_items.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${report.stock_value.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total inventory worth
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Items Alert */}
          {report.low_stock_items.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">Stock Alerts 🚨</CardTitle>
                <CardDescription className="text-orange-700">
                  Items that require immediate attention for restocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Minimum Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Shortage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.low_stock_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-red-600">
                            {item.current_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.minimum_quantity}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStockStatusColor(item.status)}>
                            {getStockStatusIcon(item.status)} {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-red-600">
                            {Math.max(0, item.minimum_quantity - item.current_quantity)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Stock Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview 📊</CardTitle>
              <CardDescription>
                Complete stock status and valuation summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Stock Health</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Items in Good Stock:</span>
                        <span className="font-medium text-green-600">
                          {report.total_items - report.low_stock_items.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Items Need Attention:</span>
                        <span className="font-medium text-orange-600">
                          {report.low_stock_items.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Stock Health:</span>
                        <span className={`font-medium ${
                          report.low_stock_items.length === 0 
                            ? 'text-green-600' 
                            : report.low_stock_items.length <= report.total_items * 0.1 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {report.low_stock_items.length === 0 
                            ? 'Excellent ✅' 
                            : report.low_stock_items.length <= report.total_items * 0.1 
                            ? 'Good ⚠️' 
                            : 'Needs Attention 🚨'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Financial Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Stock Value:</span>
                        <span className="font-medium text-green-600">
                          ${report.stock_value.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Item Value:</span>
                        <span className="font-medium">
                          ${report.total_items > 0 ? (report.stock_value / report.total_items).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Inventory Efficiency:</span>
                        <span className="font-medium text-blue-600">
                          {report.total_items > 0 
                            ? ((report.total_items - report.low_stock_items.length) / report.total_items * 100).toFixed(1)
                            : '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {report.low_stock_items.length === 0 && (
                  <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-4xl mb-2 block">🎉</span>
                    <h4 className="text-lg font-semibold text-green-800 mb-1">
                      All Items Well Stocked!
                    </h4>
                    <p className="text-green-600">
                      Your inventory levels are healthy and no immediate restocking is required.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">📦</span>
              <p className="text-gray-500">Unable to generate stock report. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
