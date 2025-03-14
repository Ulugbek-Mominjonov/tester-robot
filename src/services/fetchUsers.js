import axios from "axios";
import config from "../config";

export default async function () {
  const username = config.cashUsername;
  const password = config.cashPassword;
  // try {
  //   const response = await axios.get(config.cashUrl, {
  //     headers: {
  //       Authorization: `Basic ${btoa(`${username}:${password}`)}`,
  //       "Content-Type": "application/json",
  //     },
  //     params: {
  //       bank_name: 4,
  //     },
  //   });

  //   const users = response.data.data.filter(
  //     (user) => user.password && user.accounts.length
  //   );

  //   console.log("✅ USERS API'dan yuklandi:", cachedUsers);
  //   return users;
  // } catch (error) {
  //   console.error("Error fetching users:", error);
  //   return [];
  // }
  console.log("✅ USERS API'dan yuklandi:");
  return [
    {
      id: 39,
      username: "UBANKQ925",
      password: "asdf123456+",
      bank_id: 4,
      bank_name: "AGROBANK",
      accounts: [
        {
          aloqabank_login_id: 39,
          account_number: "20208000605401349001",
        },
      ],
    },
    {
      id: 39,
      username: "UBANKQ926",
      password: "asdf123456+",
      bank_id: 4,
      bank_name: "AGROBANK",
      accounts: [
        {
          aloqabank_login_id: 39,
          account_number: "20208000305324284001",
        },
      ],
    },
  ];
}
