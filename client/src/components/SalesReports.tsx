
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { SalesReport, ReportPeriodInput } from '../../../server/src/schema';

export function SalesReports() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<ReportPeriodInput>({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date()
  });

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getSalesReport.query(dateRange);
      setReport(result);
    } catch (error) {
      console.error('Failed to generate sales report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Sales Reports</h3>
        <p className="text-gray-500">Analyze sales performance and trends</p>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Sales Report</CardTitle>
          <CardDescription>
            Select a date range to analyze sales performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange(prev => ({ ...prev, start_date: new Date(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange(prev => ({ ...prev, end_date: new Date(e.target.value) }))
                }
              />
            </div>
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? 'Generating...' : '📊 Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${report.total_sales.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Period: {report.period}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <span className="text-2xl">🛒</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.total_transactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${report.average_transaction.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per order value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items 🏆</CardTitle>
              <CardDescription>
                Best performing menu items during the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.top_selling_items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No sales data available for the selected period
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.top_selling_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center">
                
                            <span className="mr-2">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📦'}
                            </span>
                            <span className="font-medium">{item.item_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity_sold}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-green-600">
                            ${item.revenue.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {((item.revenue / report.total_sales) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">📈</span>
              <p className="text-gray-500">Select a date range and generate a report to view sales analytics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
