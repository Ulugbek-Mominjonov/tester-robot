// globalSetup.js
import fetchUsers from "./src/services/fetchUsers";

async function globalSetup() {
  const users = await fetchUsers();
  if (users.length === 0) {
    throw new Error("❌ Users mavjud emas, testlar o'tkazilmaydi.");
  }
  // Users ni faylga saqlash yoki global state sifatida ishlatish
  process.env.USERS = JSON.stringify(users);
}

export default globalSetup;
