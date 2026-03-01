import React, { useState } from 'react';
import { User, Phone, Calendar, MapPin, Search, AlertCircle } from 'lucide-react';

interface AddCustomerProps {
  userId: string;
  userRole: string;
  onCustomerAdded?: () => void;
}

type SearchStage = 'search' | 'add' | 'found';

const AddCustomer: React.FC<AddCustomerProps> = ({ userId, userRole, onCustomerAdded }) => {
  const [stage, setStage] = useState<SearchStage>('search');
  const [searchPhone, setSearchPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'search' | 'fullName' | 'phone' | 'age' | 'address' | null>(null);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);

  // Check if customer exists
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!searchPhone.trim()) {
      setError('أدخل رقم الهاتف للبحث');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/customers/search/${searchPhone.trim()}`);
      const data = await response.json();

      if (data.found) {
        setExistingCustomer(data.data);
        setStage('found');
        setError('');
      } else {
        // Customer not found, prepare to add new
        setPhone(searchPhone.trim());
        setStage('add');
        setExistingCustomer(null);
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }

    setLoading(false);
  };

  // Add new customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!fullName.trim()) {
      setError('أدخل اسم العميل رباعي');
      setLoading(false);
      return;
    }
    if (!phone.trim()) {
      setError('أدخل رقم الهاتف');
      setLoading(false);
      return;
    }
    if (!age) {
      setError('أدخل السن');
      setLoading(false);
      return;
    }
    if (!address.trim()) {
      setError('أدخل العنوان');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          age: parseInt(age),
          address: address.trim(),
          userId: userId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`تم إضافة العميل ${fullName} بنجاح`);
        // Reset form
        setFullName('');
        setPhone('');
        setAge('');
        setAddress('');
        setSearchPhone('');
        setStage('search');
        if (onCustomerAdded) onCustomerAdded();
      } else {
        setError(data.error || 'فشل إضافة العميل');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }

    setLoading(false);
  };

  // Field component with floating label
  const FloatingLabelInput = ({
    label,
    value,
    onChange,
    fieldName,
    type = 'text',
    icon: Icon
  }: any) => (
    <div className="relative">
      <div className="relative group">
        <input
          type={type}
          required
          className="w-full pr-16 pl-8 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
          value={value}
          onChange={onChange}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => setFocusedField(null)}
          min={type === 'number' ? '1' : undefined}
          max={type === 'number' ? '150' : undefined}
        />
        <Icon className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
        <label
          className={`absolute transition-all duration-200 font-black pointer-events-none ${
            focusedField === fieldName || value
              ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
              : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
          }`}
        >
          {label}
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 pt-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-gray-800 mb-2 text-center">إضافة عميل جديد</h1>
        <p className="text-gray-600 text-center mb-8">ابحث عن العميل أولاً أو أضف عميل جديد</p>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-[2rem] text-sm font-bold mb-6 border border-green-200 flex items-center gap-3">
            <AlertCircle size={20} />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-[2rem] text-sm font-bold mb-6 border border-red-200 flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* STAGE 1: Search */}
        {stage === 'search' && (
          <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-200/50 overflow-hidden border border-gray-100 p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <h2 className="text-xl font-black text-gray-800 mb-4">البحث عن العميل</h2>

              <FloatingLabelInput
                label="رقم الهاتف"
                value={searchPhone}
                onChange={(e: any) => setSearchPhone(e.target.value)}
                fieldName="search"
                icon={Phone}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-[2rem] font-black text-lg transition-all shadow-lg"
              >
                {loading ? 'جاري البحث...' : 'بحث'}
              </button>
            </form>
          </div>
        )}

        {/* STAGE 2: Found - Customer Already Exists */}
        {stage === 'found' && existingCustomer && (
          <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-200/50 overflow-hidden border border-gray-100 p-8">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2rem] p-6 mb-6">
              <h3 className="font-black text-yellow-800 mb-3 flex items-center gap-2">
                <AlertCircle size={22} /> العميل موجود بالفعل
              </h3>
              <div className="space-y-2 text-yellow-900 font-bold">
                <p>الاسم: {existingCustomer.fullName}</p>
                <p>الهاتف: {existingCustomer.phone}</p>
                {existingCustomer.age && <p>السن: {existingCustomer.age}</p>}
                {existingCustomer.address && <p>العنوان: {existingCustomer.address}</p>}
                {existingCustomer.createdAt && (
                  <p>تاريخ التسجيل: {new Date(existingCustomer.createdAt).toLocaleDateString('ar-EG')}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStage('search');
                  setSearchPhone('');
                  setExistingCustomer(null);
                  setError('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-[2rem] font-black transition-all"
              >
                بحث جديد
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: Add - Form to Add New Customer */}
        {stage === 'add' && (
          <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-200/50 overflow-hidden border border-gray-100 p-8">
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <h2 className="text-xl font-black text-gray-800 mb-4">تفاصيل العميل الجديد</h2>

              <FloatingLabelInput
                label="الاسم رباعي"
                value={fullName}
                onChange={(e: any) => setFullName(e.target.value)}
                fieldName="fullName"
                icon={User}
              />

              <FloatingLabelInput
                label="رقم الهاتف (واتس)"
                value={phone}
                onChange={(e: any) => setPhone(e.target.value)}
                fieldName="phone"
                icon={Phone}
              />

              <FloatingLabelInput
                label="السن"
                value={age}
                onChange={(e: any) => setAge(e.target.value)}
                fieldName="age"
                type="number"
                icon={Calendar}
              />

              <FloatingLabelInput
                label="العنوان"
                value={address}
                onChange={(e: any) => setAddress(e.target.value)}
                fieldName="address"
                icon={MapPin}
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStage('search');
                    setFullName('');
                    setPhone('');
                    setAge('');
                    setAddress('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-[2rem] font-black transition-all"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-[2rem] font-black transition-all"
                >
                  {loading ? 'جاري الإضافة...' : 'إضافة العميل'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCustomer;
