// Stubbed Firebase service after reboot.
// Replace or expand implementations when re-adding Firebase functionality.

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}

export const smartLogin = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; role?: UserRole; error?: string }> => {
  // simple stub: anyone logs in successfully
  const user = { uid: 'stub', email };
  const role: UserRole = email === 'admin@elmostaqbal-lab.com' ? 'ADMIN' : 'EMPLOYEE';
  return { success: true, user, role };
};

export const resetPassword = async (email: string) => ({ success: true });
export const logoutUser = async () => ({ success: true });

export const getCurrentUser = async (): Promise<any | null> => null;
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => null;
export const updateLastLogin = async (uid: string) => {};

export const saveData = async (path: string, data: any) => ({ success: true });
export const getData = async (path: string) => null;
export const pushData = async (path: string, data: any) => ({ success: false });
export const updateData = async (path: string, data: any) => ({ success: false });
export const deleteData = async (path: string) => ({ success: false });
export const subscribeToData = (path: string, callback: (data: any) => void) => {};

export const createUserByAdmin = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  return { success: false, error: 'not implemented' };
};

export const loginUser = smartLogin;
