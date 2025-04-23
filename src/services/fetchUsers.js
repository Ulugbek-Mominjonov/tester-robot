import axios from "axios";
import config from "../config";

export default async function () {
  const username = config.cashUsername;
  const password = config.cashPassword;
  try {
    const response = await axios.get(config.cashUrl, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        "Content-Type": "application/json",
      },
      params: {
        bank_name: 5,
      },
    });

    const users = response.data.data.filter(
      (user) => user.password && user.accounts.length
    );

    console.log("✅ USERS API'dan yuklandi:", users);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}
