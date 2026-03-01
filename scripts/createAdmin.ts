import { createUserByAdmin } from '../services/firebaseService.ts';

async function main() {
  const email = 'admin@elmostaqbal-lab.com';
  const password = 'F@res222';
  const displayName = 'Administrator';
  const role = 'ADMIN';

  try {
    const res = await createUserByAdmin(email, password, displayName, role as any);
    console.log('createUserByAdmin result', res);
  } catch (e) {
    console.error('error creating admin', e);
  }
}

main();
