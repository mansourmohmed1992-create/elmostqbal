import { smartLogin } from '../services/firebaseService.ts';

async function main() {
  const email = 'admin@elmostaqbal-lab.com';
  const password = process.argv[2] || 'F@res222';

  console.log('attempting smartLogin for', email, 'with password', password);
  try {
    const result = await smartLogin(email, password);
    console.log('result:', result);
  } catch (e) {
    console.error('error during smartLogin', e);
  }
}

main();
