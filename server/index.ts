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
  const { email, password } = req.body;
  const data = readData();
  const user: User | undefined = data.users.find((u: User) => u.email === email);
  if (user && user.password === password) {
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        fullName: user.fullName,
        email: user.email, 
        phone: user.phone,
        role: user.role 
      },
      role: user.role
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Create new user/customer
app.post('/api/users', (req, res) => {
  const { email, password, role, fullName, phone, age, address } = req.body;
  const data = readData();

  // Validate required fields
  if (!fullName || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }

  // Check if email already exists (for ADMIN/EMPLOYEE)
  if (email && data.users.find((u: User) => u.email === email)) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
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
    fullName,
    email: email || `${phone}@temp.lab`,
    password: password || 'temp_' + Date.now(),
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
