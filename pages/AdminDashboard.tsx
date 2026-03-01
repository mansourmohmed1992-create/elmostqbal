import React, { useState, useEffect } from 'react';
import {
  Users,
  Edit2,
  Trash2,
  BarChart3,
  Search,
  AlertCircle,
  CheckCircle,
  BarChart,
  UsersIcon,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  age?: number | null;
  address?: string | null;
  createdAt?: string;
}

interface Customer {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  age: number;
  address: string;
  email?: string;
  role: 'CLIENT';
  createdBy: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalCustomers: number;
  totalEmployees: number;
  totalAdmins: number;
  totalTests: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'customers'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ username: '', fullName: '', email: '', password: '', phone: '', role: 'EMPLOYEE' });
  const [customerForm, setCustomerForm] = useState({ username: '', fullName: '', phone: '', age: '', address: '' });

  // add-employee removed

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.username || !employeeForm.fullName || !employeeForm.phone || !employeeForm.password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const normalizedUsername = employeeForm.username.trim().toLowerCase();
      const response = await fetch('http://localhost:4000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          fullName: employeeForm.fullName,
          email: employeeForm.email || `${normalizedUsername}@lab.com`,
          phone: employeeForm.phone,
          password: employeeForm.password,
          role: employeeForm.role
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('تم إضافة الموظف بنجاح');
        setEmployeeForm({ username: '', fullName: '', email: '', password: '', phone: '', role: 'EMPLOYEE' });
        setShowAddEmployee(false);
        await fetchAllData();
      } else {
        setError(data.error || 'فشل إضافة الموظف');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.username || !customerForm.fullName || !customerForm.phone || !customerForm.age || !customerForm.address) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const normalizedUsername = customerForm.username.trim().toLowerCase();
      const response = await fetch('http://localhost:4000/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          fullName: customerForm.fullName,
          phone: customerForm.phone,
          age: parseInt(customerForm.age),
          address: customerForm.address
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('تم إضافة العميل بنجاح');
        setCustomerForm({ username: '', fullName: '', phone: '', age: '', address: '' });
        setShowAddCustomer(false);
        await fetchAllData();
      } else {
        setError(data.error || 'فشل إضافة العميل');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, customersRes] = await Promise.all([
        fetch('http://localhost:4000/api/admin/stats'),
        fetch('http://localhost:4000/api/admin/users'),
        fetch('http://localhost:4000/api/admin/customers')
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const customersData = await customersRes.json();

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setCustomers(customersData.customers || []);
    } catch (err) {
      setError('فشل تحميل البيانات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // add-employee removed

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('هل تريد حذف هذا المستخدم؟')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('تم حذف المستخدم بنجاح');
        await fetchAllData();
      } else {
        setError(data.error || 'فشل الحذف');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('هل تريد حذف هذا العميل؟')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/admin/customers/${customerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('تم حذف العميل بنجاح');
        await fetchAllData();
      } else {
        setError(data.error || 'فشل الحذف');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.includes(searchTerm) ||
    user.email.includes(searchTerm) ||
    user.phone.includes(searchTerm)
  );

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.includes(searchTerm) ||
    customer.phone.includes(searchTerm) ||
    customer.address.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={32} className="text-blue-600" />
          <h1 className="text-3xl font-black text-gray-800">لوحة التحكم الإدارية</h1>
        </div>
        <p className="text-gray-600 font-bold">إدارة كاملة للنظام والمستخدمين والعملاء</p>
      </div>

      {/* Messages */}
      {/* error banner removed per user request */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 border border-green-200">
          <CheckCircle size={20} />
          <span className="font-bold">{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'stats', label: 'الإحصائيات', icon: BarChart },
          { id: 'users', label: 'المستخدمون', icon: Users },
          { id: 'customers', label: 'العملاء', icon: UsersIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'stats' | 'users' | 'customers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-gray-600" />
            <input
              type="text"
              placeholder="ابحث عن مستخدم..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowAddEmployee(!showAddEmployee)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors"
            >
              <Plus size={20} />
              إضافة موظف
            </button>
          </div>

          {showAddEmployee && (
            <form onSubmit={handleAddEmployee} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800">إضافة موظف جديد</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="اسم المستخدم (Username)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={employeeForm.username}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="الاسم الرباعي"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={employeeForm.fullName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني (اختياري)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="رقم الهاتف"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition-colors">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-800">{user.fullName}</h3>
                    <p className="text-sm text-gray-600">البريد: {user.email}</p>
                    <p className="text-sm text-gray-600">الهاتف: {user.phone}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'ADMIN' ? 'مسؤول' : 'موظف'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {}}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-gray-600" />
            <input
              type="text"
              placeholder="ابحث عن عميل..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowAddCustomer(!showAddCustomer)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors"
            >
              <Plus size={20} />
              إضافة عميل
            </button>
          </div>

          {showAddCustomer && (
            <form onSubmit={handleAddCustomer} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800">إضافة عميل جديد</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="اسم المستخدم (Username)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={customerForm.username}
                  onChange={(e) => setCustomerForm({ ...customerForm, username: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="الاسم الرباعي"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={customerForm.fullName}
                  onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="رقم الهاتف (واتس)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="السن"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={customerForm.age}
                  onChange={(e) => setCustomerForm({ ...customerForm, age: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="العنوان"
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition-colors">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-800">{customer.fullName}</h3>
                    <p className="text-sm text-gray-600">الهاتف: {customer.phone}</p>
                    <p className="text-sm text-gray-600">السن: {customer.age}</p>
                    <p className="text-sm text-gray-600">العنوان: {customer.address}</p>
                    <p className="text-xs text-gray-500 mt-2">أضيف بواسطة: {customer.createdBy}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
