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
  email: string;
  password: string;
  role: string;
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
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Create new user (admin only)
app.post('/api/users', (req, res) => {
  const { email, password, role } = req.body;
  const data = readData();
  if (data.users.find((u: User) => u.email === email)) {
    return res.status(400).json({ success: false, error: 'User exists' });
  }
  const id = `user_${Date.now()}`;
  data.users.push({ id, email, password, role });
  writeData(data);
  res.json({ success: true, id });
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
