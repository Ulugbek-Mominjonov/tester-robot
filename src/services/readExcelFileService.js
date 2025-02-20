import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import config from "../config/index.js";
import moment from "moment-timezone";
import axios from "axios";
import { log } from "console";
import { sendMessage as sendMessageBot } from "./telegramService.js";
import {
  extractAccountNumber,
  excelDateToJSDate,
  extractTextAndNumber,
} from "../utils/index.js";

const readExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  return data;
};

const makeBody = async (file) => {
  const folderPath = config.downloadPath;
  const filePath = path.join(folderPath, file);
  let mainAccountNumber = "";
  let sendData = [];
  mainAccountNumber = extractAccountNumber(file);
  const rawData = readExcelFile(filePath).filter((row) =>
    row.some((cell) => cell !== "")
  );

  // Sarlavhalar mavjud qatorni aniqlash
  let headerRowIndex = rawData.findIndex((row) =>
    row.some((cell) => (cell + "").trim().toLowerCase().includes("№ пп"))
  );

  if (headerRowIndex === -1) {
    const message = `❌ ${mainAccountNumber} accountda joriy holatga ma'lumot mavjud emas!`;
    console.log(message);
    await sendMessageBot(message);
    return [];
  }

  // Sarlavhalarni ajratib olish
  const headers = rawData[headerRowIndex].filter((cell) => cell !== "");

  // Asosiy ma'lumotlar qismi (header dan keyingi qatorlar)
  const data = rawData.slice(headerRowIndex + 1).map((row) => {
    let obj = {};
    headers.forEach((key, index) => {
      obj[key] = row.filter((cell) => cell !== "")[index] || "";
    });
    return obj;
  });

  for (let i = 0; i < data.length - 3; i++) {
    if (typeof data[i]["№ пп"] === "number") {
      let createdAt = moment()
        .tz("Asia/Tashkent")
        .format("YYYY-MM-DD HH:mm:ss");
      let amountDebit =
        data[i]["Обороты по дебету"].length > 1
          ? parseFloat(data[i]["Обороты по дебету"].replace(/\s/g, ""))
          : 0;
      let amountCredit =
        data[i]["Обороты по кредиту"].length > 1
          ? parseFloat(data[i]["Обороты по кредиту"].replace(/\s/g, ""))
          : 0;
      const accountData = extractTextAndNumber(data[i]["Наименование счёта"]);
      const body = {
        main_account_number: mainAccountNumber,
        date: excelDateToJSDate(data[i]["Дата документа"]),
        status: "added",
        document_code: data[i]["№  док."],
        MFO: data[i]["МФО"],
        value: amountCredit > 0 ? amountCredit : -1 * amountDebit,
        input_value: amountCredit,
        output_value: amountDebit,
        account_number: data[i]["№ счёта"],
        account_title: accountData?.text,
        account_INN: accountData?.number,
        title: data[i]["Назначение платежа"],
        created_at: createdAt,
        updated_at: createdAt,
        base_account_number: data[i]["№ счёта"].substr(9, 8),
        automatic: false,
      };

      sendData.push(body);
    }
  }

  return sendData;
};

const sendFilesData = async () => {
  const folderPath = config.downloadPath;
  try {
    if (!fs.existsSync(folderPath)) {
      console.log("❌ Papka mavjud emas:", folderPath);
      await sendMessageBot(`❌ Papka mavjud emas: ${folderPath}`);
      return;
    }

    const files = fs.readdirSync(folderPath);

    if (files.length === 0) {
      console.log("❌ Yuborish uchun fayl topilmadi.");
      await sendMessageBot("❌ Yuborish uchun fayl topilmadi.");
      return;
    }

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const body = await makeBody(file);
      if (body.length === 0) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`❌ Faylni o‘chirib bo‘lmadi: ${file}`, err);
          } else {
            console.log(`✅ Fayl o‘chirildi: ${file}`);
          }
        });
        continue;
      }
      try {
        const responseExternalApi = await axios.post(
          process.env.MAIN_CASH_FLOW_STORE_URL,
          {
            data: body,
          },
          {
            auth: {
              username: process.env.MAIN_USERNAME,
              password: process.env.MAIN_PASSWORD,
            },
          }
        );
        console.log(
          `${extractAccountNumber(file)} acount: `,
          responseExternalApi.data.message
        );
        await sendMessageBot(
          `${extractAccountNumber(file)} acount: ${
            responseExternalApi.data.message
          }`
        );
        // ✅ **Muvaffaqiyatli yuborilgandan keyin faylni o‘chirish**
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`❌ Faylni o‘chirib bo‘lmadi: ${file}`, err);
          } else {
            console.log(`✅ Fayl o‘chirildi: ${file}`);
          }
        });
      } catch (error) {
        console.log(error);
        if (error.response) {
          const errorMessage =
            `❌ ${error.response?.data?.message}` ?? "❌ No'malum xatolik";
          sendMessageBot(errorMessage);
        }
        continue;
      }
    }
  } catch (error) {
    console.error("❌ Excel fayl yuklashda xatolik:", error.message);
  }
};

export default sendFilesData;
