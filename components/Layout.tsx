
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  Settings, 
  LogOut,
  Menu,
  X,
  Dna,
  Home,
  CreditCard
} from 'lucide-react';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'EMPLOYEE', 'CLIENT'] },
  ];

  // إذا كان الموظف أو المدير
  if (user?.role === 'ADMIN' || user?.role === 'EMPLOYEE') {
    navItems.push({ name: 'سجل المرضى', path: '/patients', icon: <Users size={20} />, roles: ['ADMIN', 'EMPLOYEE'] });
    navItems.push({ name: 'الحسابات', path: '/accounts', icon: <CreditCard size={20} />, roles: ['ADMIN', 'EMPLOYEE'] });
  }

  // إذا كان عميل
  if (user?.role === 'CLIENT') {
    navItems.push({ name: 'طلب تحليل منزلي', path: '/home-test', icon: <Home size={20} />, roles: ['CLIENT'] });
  }

  navItems.push({ name: 'نتائج المريض', path: '/', icon: <Dna size={20} />, roles: ['ADMIN', 'EMPLOYEE', 'CLIENT'] });

  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'إدارة المستخدمين', path: '/admin', icon: <Settings size={20} />, roles: ['ADMIN'] });
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-['Cairo']">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <Logo className="w-full justify-start" color="#2563eb" showText={true} />
            <div className="mt-2 pr-2">
              <p className="text-[10px] text-blue-600 font-bold tracking-widest uppercase border-t border-blue-50 pt-2 inline-block">للتحاليل الطبية الكيميائية</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 font-black text-sm
                  ${location.pathname === item.path 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                    : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}
                `}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 text-sm bg-slate-50 rounded-3xl mb-4 border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-lg">
                {user?.name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-blue-500 font-black">
                  {user?.role === 'ADMIN' ? 'مدير المختبر'
                    : user?.role === 'EMPLOYEE' ? (user?.jobTitle || 'موظف')
                    : user?.role === 'CLIENT' ? 'عميل'
                    : (user?.jobTitle || user?.role || '')}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-sm"
            >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-100 p-4 flex items-center justify-between lg:hidden shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-slate-50 rounded-xl">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <Logo className="w-auto h-10" showText={true} color="#2563eb" />
          </div>
          <div className="w-10" />
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
