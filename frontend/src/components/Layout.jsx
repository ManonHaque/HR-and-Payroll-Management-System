import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu,
  Search,
  Bell,
  LayoutDashboard,
  User,
  Users,
  Clock,
  Calendar,
  CalendarDays,
  FileText,
  TrendingUp,
  Gift,
  BadgePercent,
  MinusCircle,
  Layers,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'WORKFORCE',
    items: [
      { name: 'Employee', href: '/employee', icon: User },
      { name: 'Employee Configuration', href: '/employee-config', icon: Users },
      { name: 'Attendance', href: '/attendance', icon: Clock },
      { name: 'Overtime Configuration', href: '/overtime', icon: Calendar },
      { name: 'Leave Management', href: '/leave', icon: CalendarDays },
    ]
  },
  {
    title: 'PAY',
    items: [
      { name: 'Salary Generation', href: '/salary', icon: FileText },
      { name: 'Salary Structure', href: '/salary-structure', icon: Layers },
      { name: 'Increment', href: '/increment', icon: TrendingUp },
      { name: 'Bonus', href: '/bonus', icon: Gift },
      { name: 'Allowance', href: '/allowance', icon: BadgePercent },
      { name: 'Deduction', href: '/deduction', icon: MinusCircle },
      { name: 'Loan & Advance', href: '/loan-advance', icon: Wallet },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Reporting', href: '/reporting', icon: BarChart3 },
      { name: 'Security', href: '/security', icon: ShieldCheck },
      { name: 'Setting', href: '/settings', icon: Settings },
    ]
  }
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-brand-bg font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-sidebar hidden md:flex md:flex-col shadow-lg z-10 rounded-r-2xl">
        <div className="pt-6 pb-4 px-6">
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">HR and Payroll MS</h1>
          <p className="text-xs text-gray-500 mt-1">Payroll & Workforce</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 pb-6 custom-scrollbar">
          <nav className="space-y-6 px-4">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 text-xs font-semibold text-gray-400 tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                          isActive
                            ? 'bg-brand-active text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          className={`mr-3 flex-shrink-0 h-4 w-4 ${
                            isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 mt-2">
          <div className="flex items-center flex-1">
            <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-white/20 mr-2">
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-blue-500" />
              </div>
              <input
                type="text"
                placeholder="Search employees, requests..."
                className="block w-full pl-10 pr-3 py-2 border-none rounded-full leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 sm:text-sm shadow-sm"
              />
            </div>
          </div>
          <div className="ml-4 flex items-center">
            <button className="p-2 rounded-full text-orange-500 hover:bg-white/20 transition-colors relative">
              <Bell className="h-5 w-5 fill-current" />
            </button>
          </div>
        </header>

        {/* Main Content (Outlet for Routes) */}
        <main className="flex-1 overflow-y-auto p-6 pt-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
