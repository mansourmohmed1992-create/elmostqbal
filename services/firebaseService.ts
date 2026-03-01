// API service communicating with local Express backend.

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}

const API_ROOT = 'http://localhost:4000/api';

async function post(path: string, body: any) {
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err.error || 'request failed');
    } catch {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  }
  
  const text = await res.text();
  if (!text) {
    throw new Error('Empty response from server');
  }
  
  return JSON.parse(text);
}

async function get(path: string) {
  const res = await fetch(`${API_ROOT}${path}`);
  const text = await res.text();
  if (!text) {
    throw new Error('Empty response from server');
  }
  return JSON.parse(text);
}

export const smartLogin = async (
  username: string,
  password: string
): Promise<{ success: boolean; user?: any; role?: UserRole; error?: string; errorCode?: string }> => {
  try {
    console.log('Attempting login with username:', username);
    const resp = await post('/login', { username, password });
    console.log('Login response:', resp);
    if (resp.success && resp.user) {
      return {
        success: true,
        user: resp.user,
        role: resp.role || 'CLIENT'
      };
    }
    return { 
      success: false, 
      error: resp.error || 'خطأ في تسجيل الدخول',
      errorCode: 'AUTH_FAILED'
    };
  } catch (e: any) {
    console.error('Login error:', e);
    return { 
      success: false, 
      error: e.message || 'خطأ في الاتصال بالخادم',
      errorCode: 'NETWORK_ERROR'
    };
  }
};

export const resetPassword = async (email: string) => {
  return post('/reset-password', { email });
};

export const logoutUser = async () => ({ success: true });

export const getCurrentUser = async (): Promise<any | null> => null;
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => null;
export const updateLastLogin = async (uid: string) => {};

export const saveData = async (path: string, data: any) => {
  return post(`/${path}`, data);
};

export const getData = async (path: string) => {
  return get(`/${path}`);
};

export const pushData = async (path: string, data: any) => ({ success: false });
export const updateData = async (path: string, data: any) => ({ success: false });
export const deleteData = async (path: string) => ({ success: false });
export const subscribeToData = (_path: string, _callback: (data: any) => void) => {};

export const createUserByAdmin = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  return post('/users', { email, password, role });
};

export const loginUser = smartLogin;
