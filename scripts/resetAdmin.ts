import { resetPassword } from '../services/firebaseService.ts';

async function main() {
  const email = 'admin@elmostaqbal-lab.com';
  console.log('requesting reset email for', email);
  const res = await resetPassword(email);
  console.log('reset result', res);
}

main().catch(console.error);
