import axios from "axios";
import fs from "fs";
import config from "../config/index.js";
import path from "path";
import FormData from "form-data";
import { log } from "console";

const url = `https://api.telegram.org/bot${config.telegram.botToken}`;

const sendMessage = async (message) => {
  for (const chatId of config.telegram.chatIds) {
    try {
      await axios.post(`${url}/sendMessage`, {
        chat_id: chatId,
        text: message,
      });
    } catch (error) {
      console.error(`❌ Xatolik (${chatId}):`, error.message);
    }
  }
};

const sendFiles = async (files, folderPath) => {
  for (const file of files) {
    const filePath = path.join(folderPath, file);

    for (const chatId of config.telegram.chatIds) {
      try {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("document", fs.createReadStream(filePath));

        await axios.post(`${url}/sendDocument`, formData, {
          headers: formData.getHeaders(),
        });

        console.log(`📤 Fayl (${file}) ${chatId} ga yuborildi.`);
      } catch (error) {
        console.error(`❌ Fayl yuborishda xatolik (${chatId}):`, error.message);
      }
    }
  }
};

const sendToTelegram = async (folderPath) => {
  const url = `https://api.telegram.org/bot${config.telegram.botToken}`;
  try {
    if (!fs.existsSync(folderPath)) {
      console.log("❌ Papka mavjud emas:", folderPath);
      return;
    }

    const files = fs.readdirSync(folderPath).filter((file) => {
      return (
        file.endsWith(".xls") ||
        file.endsWith(".xlsx") ||
        file.endsWith(".json")
      );
    });

    if (files.length === 0) {
      console.log("❌ Yuborish uchun fayl topilmadi.");
      await sendMessage("(Universal bank) ❌ Yuborish uchun fayl topilmadi.");
      return;
    }

    await sendFiles(files, folderPath);
  } catch (error) {
    console.error("❌ Telegramga yuborishda xatolik:", error.message);
  }
};

export { sendToTelegram, sendMessage };
