import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Search,
  AlertCircle,
  CheckCircle,
  BarChart,
  UsersIcon,
  ShieldCheck
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
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'customers' | 'add-employee'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for adding employee
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'EMPLOYEE'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.fullName || !formData.password || !formData.phone) {
      setError('جميع الحقول المطلوبة: اسم المستخدم، الاسم الرباعي، كلمة المرور، رقم الهاتف');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`تم إضافة ${formData.role === 'EMPLOYEE' ? 'الموظف' : 'الإدارة'} بنجاح`);
        setFormData({ username: '', fullName: '', email: '', password: '', phone: '', role: 'EMPLOYEE' });
        await fetchAllData();
      } else {
        setError(data.error || 'فشل الإضافة');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }
  };

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
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}
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
          { id: 'customers', label: 'العملاء', icon: UsersIcon },
          { id: 'add-employee', label: 'إضافة موظف', icon: Plus }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4 font-bold">جاري التحميل...</p>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'blue' },
            { label: 'إجمالي الموظفين', value: stats.totalEmployees, icon: Users, color: 'green' },
            { label: 'إجمالي الإدارات', value: stats.totalAdmins, icon: ShieldCheck, color: 'red' },
            { label: 'إجمالي العملاء', value: stats.totalCustomers, icon: UsersIcon, color: 'purple' },
            { label: 'إجمالي الاختبارات', value: stats.totalTests, icon: BarChart3, color: 'yellow' }
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 p-6 rounded-lg border border-${stat.color}-200 shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`text-${stat.color}-600`} size={28} />
                <p className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</p>
              </div>
              <p className={`text-${stat.color}-700 font-bold`}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Tab */}
      {activeTab === 'add-employee' && (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          <form onSubmit={handleAddEmployee} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">الاسم الرباعي</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">كلمة المرور</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">الدور</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="EMPLOYEE">موظف</option>
                <option value="ADMIN">مسؤول</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-black transition-colors"
            >
              إضافة {formData.role === 'EMPLOYEE' ? 'موظف' : 'مسؤول'}
            </button>
          </form>
        </div>
      )}

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
          </div>

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
          </div>

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
