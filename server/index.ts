import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_PATH = path.join(__dirname, 'data.json');

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  phone: string;
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
  password?: string;
  role: 'CLIENT';
  createdBy: string;
  createdAt: string;
}

interface LabTest {
  id: string;
  patient: string;
  status: string;
  results?: any;
}

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data: any) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Authentication endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Raw request body:', JSON.stringify(req.body));
  const data = readData();
  console.log('All users in database:', JSON.stringify(data.users));
  const user: User | undefined = data.users.find((u: User) => u.username === username);
  console.log('Login attempt with username:', username);
  console.log('User found:', !!user);
  console.log('User data:', user);
  console.log('Password match:', user && user.password === password, 'provided:', password, 'stored:', user?.password);
  if (user && user.password === password) {
    const loginResponse = {
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        fullName: user.fullName,
        email: user.email, 
        phone: user.phone,
        role: user.role 
      },
      role: user.role
    };
    console.log('Login response:', JSON.stringify(loginResponse));
    res.json(loginResponse);
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Create new user/customer
app.post('/api/users', (req, res) => {
  const { username, password, role, fullName, phone, age, address, email } = req.body;
  const data = readData();

  // Validate required fields
  if (!username || !fullName || !phone || !password) {
    return res.status(400).json({ success: false, error: 'Username, fullName, phone, and password are required' });
  }

  // Check if username already exists
  if (data.users.find((u: User) => u.username === username)) {
    return res.status(400).json({ success: false, error: 'Username already exists' });
  }

  // Check if phone already exists
  const phoneExists = data.users.find((u: User) => u.phone === phone) || 
                      (data.customers && data.customers.find((c: Customer) => c.phone === phone));
  if (phoneExists) {
    return res.status(400).json({ success: false, error: 'Phone number already registered' });
  }

  const id = `user_${Date.now()}`;
  const user: User = {
    id,
    username,
    fullName,
    email: email || `${username}@elmostaqbal-lab.com`,
    password,
    role: (role || 'CLIENT') as 'ADMIN' | 'EMPLOYEE' | 'CLIENT',
    phone,
    age: age || null,
    address: address || null,
    createdAt: new Date().toISOString()
  };

  data.users.push(user);
  writeData(data);
  res.json({ success: true, id, user });
});

// Create customer by admin/employee
app.post('/api/customers', (req, res) => {
  const { fullName, phone, age, address, userId } = req.body;
  const data = readData();

  // Validate required fields
  if (!fullName || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }

  // Check if phone already exists
  const phoneExists = data.customers?.find((c: Customer) => c.phone === phone) || 
                      data.users?.find((u: User) => u.phone === phone);
  if (phoneExists) {
    return res.status(400).json({ success: false, error: 'Customer with this phone already exists' });
  }

  const id = `customer_${Date.now()}`;
  const customer: Customer = {
    id,
    fullName,
    phone,
    age,
    address,
    role: 'CLIENT',
    createdBy: userId,
    createdAt: new Date().toISOString()
  };

  if (!data.customers) data.customers = [];
  data.customers.push(customer);
  writeData(data);
  res.json({ success: true, id, customer });
});

// Search for customer by phone
app.get('/api/customers/search/:phone', (req, res) => {
  const data = readData();
  const phone = req.params.phone;
  const inUsers = data.users?.find((u: User) => u.phone === phone);
  const inCustomers = data.customers?.find((c: Customer) => c.phone === phone);
  
  if (inUsers) {
    res.json({ found: true, type: 'user', data: inUsers });
  } else if (inCustomers) {
    res.json({ found: true, type: 'customer', data: inCustomers });
  } else {
    res.json({ found: false });
  }
});

// Admin endpoints
// Get all users (Admin only)
app.get('/api/admin/users', (req, res) => {
  const data = readData();
  res.json({ success: true, users: data.users || [] });
});

// Get all customers (Admin only)
app.get('/api/admin/customers', (req, res) => {
  const data = readData();
  res.json({ success: true, customers: data.customers || [] });
});

// Create new employee (Admin only)
app.post('/api/admin/create-employee', (req, res) => {
  const { username, password, fullName, phone, email, role } = req.body;
  const data = readData();

  if (!username || !fullName || !password || !phone) {
    return res.status(400).json({ success: false, error: 'Missing required fields: username, fullName, password, phone' });
  }

  // Check if username already exists
  if (data.users.find((u: User) => u.username === username)) {
    return res.status(400).json({ success: false, error: 'Username already exists' });
  }

  // Check if phone already exists
  const phoneExists = data.users.find((u: User) => u.phone === phone);
  if (phoneExists) {
    return res.status(400).json({ success: false, error: 'Phone already registered' });
  }

  const newEmployee: User = {
    id: Date.now().toString(),
    username,
    fullName,
    email: email || `${username}@elmostaqbal-lab.com`,
    password,
    phone,
    role: role === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN',
    age: null,
    address: null,
    createdAt: new Date().toISOString()
  };

  data.users.push(newEmployee);
  writeData(data);

  res.json({ 
    success: true, 
    message: 'Employee created successfully',
    user: newEmployee 
  });
});

// Edit user (Admin only)
app.put('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, email, password, phone, age, address, role } = req.body;
  const data = readData();

  const userIndex = data.users.findIndex((u: User) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const user = data.users[userIndex];

  // Check email uniqueness if changed
  if (email && email !== user.email && data.users.find((u: User) => u.email === email)) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
  }

  // Check phone uniqueness if changed
  if (phone && phone !== user.phone && data.users.find((u: User) => u.phone === phone)) {
    return res.status(400).json({ success: false, error: 'Phone already registered' });
  }

  // Update user
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (password) user.password = password;
  if (phone) user.phone = phone;
  if (age !== undefined) user.age = age;
  if (address) user.address = address;
  if (role) user.role = role;

  writeData(data);

  res.json({ 
    success: true, 
    message: 'User updated successfully',
    user 
  });
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();

  // Prevent deleting the admin itself
  if (id === 'admin') {
    return res.status(403).json({ success: false, error: 'Cannot delete admin account' });
  }

  const userIndex = data.users.findIndex((u: User) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const deletedUser = data.users.splice(userIndex, 1);
  writeData(data);

  res.json({ 
    success: true, 
    message: 'User deleted successfully',
    user: deletedUser[0]
  });
});

// Delete customer (Admin only)
app.delete('/api/admin/customers/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();

  const customerIndex = data.customers.findIndex((c: Customer) => c.id === id);
  if (customerIndex === -1) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const deletedCustomer = data.customers.splice(customerIndex, 1);
  writeData(data);

  res.json({ 
    success: true, 
    message: 'Customer deleted successfully',
    customer: deletedCustomer[0]
  });
});

// Get dashboard stats (Admin only)
app.get('/api/admin/stats', (req, res) => {
  const data = readData();

  const stats = {
    totalUsers: data.users?.length || 0,
    totalCustomers: data.customers?.length || 0,
    totalEmployees: data.users?.filter((u: User) => u.role === 'EMPLOYEE').length || 0,
    totalAdmins: data.users?.filter((u: User) => u.role === 'ADMIN').length || 0,
    totalTests: data.tests?.length || 0
  };

  res.json({ success: true, stats });
});



// helper to resolve nested key path
function getNested(data: any, path: string) {
  const parts = path.split('/');
  let obj = data;
  for (const p of parts) {
    if (obj[p] === undefined) return undefined;
    obj = obj[p];
  }
  return obj;
}

function setNested(data: any, path: string, value: any) {
  const parts = path.split('/');
  let obj = data;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (obj[p] === undefined) obj[p] = {};
    obj = obj[p];
  }
  obj[parts[parts.length - 1]] = value;
}

// generic data retrieval (wildcard)
app.get(/^\/api\/data\/(.+)$/, (req, res) => {
  const data = readData();
  const key = req.params[0];
  const val = getNested(data, key);
  res.json(val !== undefined ? val : []);
});

// generic data save (overwrite)
app.post(/^\/api\/data\/(.+)$/, (req, res) => {
  const data = readData();
  const key = req.params[0];
  setNested(data, key, req.body);
  writeData(data);
  res.json({ success: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
