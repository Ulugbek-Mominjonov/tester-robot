import dotenv from "dotenv";

dotenv.config();

const toDate = () => {
  return process.env.TO_DATE || new Date().toLocaleDateString("ru-RU");
};

const calculateFromDate = () => {
  let fromDate = new Date(toDate().split(".").reverse().join("-"));
  fromDate.setDate(fromDate.getDate() - process.env.INTERVAL || 2);
  return fromDate.toLocaleDateString("ru-RU");
};

const fromDate = () => {
  return process.env.FROM_DATE || calculateFromDate();
};

const config = {
  port: process.env.PORT || 3000,
  bankUrl: process.env.BANK_URL,
  downloadPath: process.env.DOWNLOAD_PATH || "./downloads/",
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatIds: process.env.TELEGRAM_CHAT_IDS.split(","),
  },
  cashUrl: process.env.CASH_URL,
  cashUsername: process.env.CASH_USERNAME,
  cashPassword: process.env.CASH_PASSWORD,
  fromDate: fromDate(),
  toDate: toDate(),
};

export default config;
