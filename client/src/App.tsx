
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { MenuManagement } from '@/components/MenuManagement';
import { StockManagement } from '@/components/StockManagement';
import { UserManagement } from '@/components/UserManagement';
import { IncomeManagement } from '@/components/IncomeManagement';
import { ExpenseManagement } from '@/components/ExpenseManagement';
import { SalesTransactionManagement } from '@/components/SalesTransactionManagement';
import { SalesReports } from '@/components/SalesReports';
import { StockReports } from '@/components/StockReports';
import { ProfitLossReports } from '@/components/ProfitLossReports';

// Using type-only imports for better TypeScript compliance
import type { 
  SalesTransaction, 
  StockItem,
  Income,
  Expense 
} from '../../server/src/schema';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    recentTransactions: [] as SalesTransaction[],
    lowStockItems: [] as StockItem[],
    todayIncome: 0,
    todayExpenses: 0,
    totalMenuItems: 0,
    isLoading: true
  });

  // Load dashboard overview data
  const loadDashboardData = useCallback(async () => {
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      
      const [transactions, stockItems, menuItems, income, expenses] = await Promise.all([
        trpc.getSalesTransactions.query(),
        trpc.getStockItems.query(), 
        trpc.getMenuItems.query(),
        trpc.getIncome.query(),
        trpc.getExpenses.query()
      ]);

      // Calculate today's totals
      const today = new Date().toDateString();
      const todayIncome = income
        .filter((item: Income) => new Date(item.date).toDateString() === today)
        .reduce((sum: number, item: Income) => sum + item.amount, 0);
      
      const todayExpenses = expenses
        .filter((item: Expense) => new Date(item.date).toDateString() === today)
        .reduce((sum: number, item: Expense) => sum + item.amount, 0);

      // Find low stock items
      const lowStockItems = stockItems.filter((item: StockItem) => 
        item.current_quantity <= item.minimum_quantity
      );

      setDashboardData({
        recentTransactions: transactions.slice(0, 5),
        lowStockItems: lowStockItems.slice(0, 5),
        todayIncome,
        todayExpenses,
        totalMenuItems: menuItems.length,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (activeModule === 'dashboard') {
      loadDashboardData();
    }
  }, [activeModule, loadDashboardData]);

  const sidebarItems = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '🏠' },
    { id: 'menu', label: '🍽️ Menu Management', icon: '📋' },
    { id: 'stock', label: '📦 Stock Management', icon: '📊' },
    { id: 'users', label: '👥 User Management', icon: '👤' },
    { id: 'income', label: '💰 Income Management', icon: '💵' },
    { id: 'expenses', label: '💸 Expense Management', icon: '🧾' },
    { id: 'sales', label: '🛒 Sales Transactions', icon: '💳' },
    { id: 'sales-reports', label: '📈 Sales Reports', icon: '📊' },
    { id: 'stock-reports', label: '📋 Stock Reports', icon: '📦' },
    { id: 'profit-loss', label: '💹 Profit & Loss Reports', icon: '📈' }
  ];

  const renderDashboard = () => {
    if (dashboardData.isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Income</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${dashboardData.todayIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
              <span className="text-2xl">💸</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${dashboardData.todayExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <span className="text-2xl">🍽️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.totalMenuItems}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <span className="text-2xl">⚠️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData.lowStockItems.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions 🛒</CardTitle>
              <CardDescription>Latest sales activity</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentTransactions.map((transaction: SalesTransaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{transaction.transaction_number}</div>
                        <div className="text-sm text-gray-500">
                          {transaction.customer_name || 'Walk-in Customer'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${transaction.final_amount.toFixed(2)}
                        </div>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts ⚠️</CardTitle>
              <CardDescription>Items that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.lowStockItems.length === 0 ? (
                <p className="text-green-500 text-center py-4">✅ All items well stocked!</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.lowStockItems.map((item: StockItem) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {item.current_quantity} / {item.minimum_quantity}
                        </div>
                        <div className="text-xs text-red-500">Low Stock</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return renderDashboard();
      case 'menu':
        return <MenuManagement />;
      case 'stock':
        return <StockManagement />;
      case 'users':
        return <UserManagement />;
      case 'income':
        return <IncomeManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'sales':
        return <SalesTransactionManagement />;
      case 'sales-reports':
        return <SalesReports />;
      case 'stock-reports':
        return <StockReports />;
      case 'profit-loss':
        return <ProfitLossReports />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">🏪 Restaurant POS</h1>
          <p className="text-sm text-gray-500">Management System</p>
        </div>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="p-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeModule === item.id ? 'default' : 'ghost'}
                className="w-full justify-start mb-1 text-left"
                onClick={() => setActiveModule(item.id)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {sidebarItems.find(item => item.id === activeModule)?.label || 'Dashboard'}
                </h2>
                <p className="text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  System Online ✅
                </Badge>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {renderActiveModule()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
