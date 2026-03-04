import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mansourmohmed1992_db_user:IGw2FPf1Mn9pbjF@cluster0.z6qpks.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB successfully!');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ==================== SCHEMAS ====================

const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'EMPLOYEE', 'CLIENT'], default: 'CLIENT' },
  phone: String,
  age: Number,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

const CustomerSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  age: Number,
  address: String,
  email: String,
  password: { type: String, required: true },
  role: { type: String, default: 'CLIENT' },
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const TestSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  patientId: String,
  patientName: String,
  patientPhone: String,
  testName: String,
  status: String,
  results: mongoose.Schema.Types.Mixed,
  resultUploadedDate: String,
  date: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Test = mongoose.model('Test', TestSchema);

// ==================== MIDDLEWARE ====================

// Initialize default admin and employee users
async function initializeDefaultUsers() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        id: 'admin',
        username: 'admin',
        fullName: 'مدير النظام',
        email: 'admin@elmostaqbal-lab.com',
        password: 'F@res222',
        role: 'ADMIN',
        phone: '201000000001'
      });
      console.log('✅ Default admin user created');
    }

    const emp1Exists = await User.findOne({ username: 'e1' });
    if (!emp1Exists) {
      await User.create({
        id: 'user_1772551870915',
        username: 'e1',
        fullName: 'منصور',
        email: 'e1@lab.com',
        password: 'F@res222',
        role: 'EMPLOYEE',
        phone: '201023764469'
      });
      console.log('✅ Default employee user created');
    }
  } catch (error: any) {
    if (!error.message.includes('duplicate')) {
      console.error('Error initializing default users:', error.message);
    }
  }
}

// Initialize default users on startup
initializeDefaultUsers();

// ==================== API ENDPOINTS ====================

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username.toLowerCase(), password });
    if (user) {
      res.json({ 
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
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new user
app.post('/api/admin/users', async (req, res) => {
  const { username, fullName, email, password, role, phone } = req.body;
  try {
    const newUser = await User.create({
      id: `user_${Date.now()}`,
      username: username.toLowerCase(),
      fullName,
      email,
      password,
      role: role || 'EMPLOYEE',
      phone: phone || ''
    });
    res.json({ success: true, user: newUser });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update user
app.put('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password, phone, age, address, role } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { fullName, email, password, phone, age, address, role },
      { new: true }
    );
    res.json({ success: true, user: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted', user: deleted });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOMERS (PATIENTS) ====================

// Get all customers
app.get('/api/admin/customers', async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json({ success: true, customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new customer
app.post('/api/admin/customers', async (req, res) => {
  const { username, fullName, phone, age, address, password } = req.body;
  try {
    const newCustomer = await Customer.create({
      id: `customer_${Date.now()}`,
      username: username.toLowerCase(),
      fullName,
      phone,
      age,
      address,
      email: `${username}@lab.local`,
      password: password || Math.random().toString(36).slice(-10),
      role: 'CLIENT',
      createdBy: 'admin'
    });
    res.json({ success: true, customer: newCustomer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update customer
app.put('/api/admin/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { username, fullName, phone, age, address, password } = req.body;
  try {
    const updated = await Customer.findByIdAndUpdate(
      id,
      { username: username?.toLowerCase(), fullName, phone, age, address, password },
      { new: true }
    );
    
    if (!updated) {
      const customer = await Customer.findOne({ id });
      if (customer) {
        Object.assign(customer, { username: username?.toLowerCase(), fullName, phone, age, address, password });
        await customer.save();
        return res.json({ success: true, customer });
      }
    }
    
    res.json({ success: true, customer: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete customer
app.delete('/api/admin/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) {
      deleted = await Customer.findOneAndDelete({ id });
    }
    res.json({ success: true, message: 'Customer deleted', customer: deleted });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== TESTS ====================

// Get all tests
app.get('/api/admin/tests', async (req, res) => {
  try {
    const tests = await Test.find({});
    res.json({ success: true, tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new test
app.post('/api/admin/tests', async (req, res) => {
  const { patientId, patientName, testName, status, results } = req.body;
  try {
    const newTest = await Test.create({
      id: `test_${Date.now()}`,
      patientId,
      patientName,
      testName,
      status,
      results,
      date: new Date().toISOString().split('T')[0]
    });
    res.json({ success: true, test: newTest });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update test
app.put('/api/admin/tests/:id', async (req, res) => {
  const { id } = req.params;
  const { testName, status, results } = req.body;
  try {
    let updated = await Test.findByIdAndUpdate(
      id,
      { testName, status, results },
      { new: true }
    );
    
    if (!updated) {
      const test = await Test.findOne({ id });
      if (test) {
        Object.assign(test, { testName, status, results });
        await test.save();
        return res.json({ success: true, test });
      }
    }
    
    res.json({ success: true, test: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete test
app.delete('/api/admin/tests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let deleted = await Test.findByIdAndDelete(id);
    if (!deleted) {
      deleted = await Test.findOneAndDelete({ id });
    }
    res.json({ success: true, message: 'Test deleted', test: deleted });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== SERVER START ====================

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
