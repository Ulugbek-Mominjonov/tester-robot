import dotenv from "dotenv";

dotenv.config();

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
};

export default config;
