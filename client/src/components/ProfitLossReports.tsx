
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { ProfitLossReport, ReportPeriodInput } from '../../../server/src/schema';

export function ProfitLossReports() {
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<ReportPeriodInput>({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date()
  });

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getProfitLossReport.query(dateRange);
      setReport(result);
    } catch (error) {
      console.error('Failed to generate profit & loss report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProfitabilityStatus = (margin: number) => {
    if (margin >= 20) return { status: 'Excellent', icon: '🎉', color: 'text-green-600' };
    if (margin >= 10) return { status: 'Good', icon: '✅', color: 'text-yellow-600' };
    if (margin >= 0) return { status: 'Break Even', icon: '⚖️', color: 'text-gray-600' };
    return { status: 'Loss', icon: '⚠️', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Profit & Loss Reports</h3>
        <p className="text-gray-500">Analyze financial performance and profitability</p>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Generate P&L Report</CardTitle>
          <CardDescription>
            Select a date range to analyze your financial performance
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
              {isLoading ? 'Generating...' : '💹 Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className={`border-2 ${
            report.net_profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Financial Summary</span>
                <span className="text-2xl">
                  {report.net_profit >= 0 ? '📈' : '📉'}
                </span>
              </CardTitle>
              <CardDescription>
                Period: {report.period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(report.total_revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Expenses:</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(report.total_expenses)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Net Profit:</span>
                      <span className={`text-xl font-bold ${
                        report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(report.net_profit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Profit Margin:</span>
                      <span className={`text-lg font-bold ${getProfitabilityStatus(report.profit_margin).color}`}>
                        {report.profit_margin.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(Math.max(report.profit_margin, 0), 100)} 
                      className="h-3"
                    />
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white border">
                    <div className="text-2xl mb-1">
                      {getProfitabilityStatus(report.profit_margin).icon}
                    </div>
                    <div className={`font-semibold ${getProfitabilityStatus(report.profit_margin).color}`}>
                      {getProfitabilityStatus(report.profit_margin).status}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Revenue Analysis 💰</CardTitle>
                <CardDescription>
                  Income sources and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {formatCurrency(report.total_revenue)}
                      </div>
                      <div className="text-sm text-green-700">Total Revenue</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gross Profit:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(report.gross_profit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Revenue Growth:</span>
                      <span className="font-semibold">
                        {/* This would need historical data to calculate */}
                        N/A
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Expense Analysis 💸</CardTitle>
                <CardDescription>
                  Cost structure and spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-1">
                        {formatCurrency(report.total_expenses)}
                      </div>
                      <div className="text-sm text-red-700">Total Expenses</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Expense Ratio:</span>
                      <span className="font-semibold text-red-600">
                        {report.total_revenue > 0 
                          ? ((report.total_expenses / report.total_revenue) * 100).toFixed(1)
                          : '0.0'
                        }% of Revenue
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost Control:</span>
                      <span className={`font-semibold ${
                        (report.total_expenses / report.total_revenue) <= 0.7 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(report.total_expenses / report.total_revenue) <= 0.7 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators 📊</CardTitle>
              <CardDescription>
                Essential metrics for business health assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-sm text-gray-600 mb-1">Gross Profit</div>
                  <div className="font-bold text-green-600">
                    {formatCurrency(report.gross_profit)}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">📈</div>
                  <div className="text-sm text-gray-600 mb-1">Net Profit</div>
                  <div className={`font-bold ${report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.net_profit)}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm text-gray-600 mb-1">Profit Margin</div>
                  <div className={`font-bold ${getProfitabilityStatus(report.profit_margin).color}`}>
                    {report.profit_margin.toFixed(1)}%
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm text-gray-600 mb-1">Break Even</div>
                  <div className={`font-bold ${report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.net_profit >= 0 ? 'Achieved' : 'Not Met'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Business Insights & Recommendations 💡</CardTitle>
              <CardDescription>
                Actionable insights based on your financial performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.profit_margin >= 20 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2">✅</span>
                      <div>
                        <div className="font-semibold text-green-800">Excellent Performance</div>
                        <div className="text-sm text-green-700">
                          Your profit margin is excellent. Consider investing in expansion or new equipment.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {report.profit_margin >= 10 && report.profit_margin < 20 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚡</span>
                      <div>
                        <div className="font-semibold text-yellow-800">Good Performance</div>
                        <div className="text-sm text-yellow-700">
                          Solid profitability. Look for opportunities to optimize costs and increase revenue.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {report.profit_margin < 10 && report.profit_margin >= 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-orange-600 mr-2">⚠️</span>
                      <div>
                        <div className="font-semibold text-orange-800">Needs Improvement</div>
                        <div className="text-sm text-orange-700">
                          Low profit margins. Review pricing strategy and reduce unnecessary expenses.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {report.profit_margin < 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-red-600 mr-2">🚨</span>
                      <div>
                        <div className="font-semibold text-red-800">Immediate Action Required</div>
                        <div className="text-sm text-red-700">
                          Operating at a loss. Urgent review of costs and revenue strategies needed.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <div>
                      <div className="font-semibold text-blue-800">General Tips</div>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Monitor food costs and waste regularly</li>
                        <li>• Review menu pricing quarterly</li>
                        <li>• Track daily expense patterns</li>
                        <li>• Compare performance month-over-month</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💹</span>
              <p className="text-gray-500">Select a date range and generate a report to view financial analysis</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
