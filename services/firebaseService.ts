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
  try {
    console.log(`POST ${API_ROOT}${path}:`, body);
    const res = await fetch(`${API_ROOT}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    console.log(`Response status: ${res.status}`);
    
    let responseText = '';
    try {
      responseText = await res.text();
      console.log(`Response text: ${responseText}`);
    } catch (e) {
      console.error('Error reading response:', e);
      throw new Error('Failed to read response');
    }
    
    if (!res.ok) {
      try {
        const err = JSON.parse(responseText);
        throw new Error(err.error || `request failed: ${res.status}`);
      } catch {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }
    
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(responseText);
    console.log('Parsed data:', data);
    return data;
  } catch (e: any) {
    console.error('POST error:', e.message);
    throw e;
  }
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
    console.log('smartLogin called with username:', username);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000)
    );
    
    const loginPromise = post('/login', { username, password });
    const resp = await Promise.race([loginPromise, timeoutPromise]);
    
    console.log('smartLogin response:', resp);
    
    if (resp && resp.success && resp.user) {
      return {
        success: true,
        user: resp.user,
        role: resp.role || 'CLIENT'
      };
    }
    return { 
      success: false, 
      error: resp?.error || 'خطأ في تسجيل الدخول',
      errorCode: 'AUTH_FAILED'
    };
  } catch (e: any) {
    console.error('smartLogin error:', e);
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
