import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import config from "../config/index.js";
import moment from "moment-timezone";
import axios from "axios";
import iconv from "iconv-lite";
import { sendMessage as sendMessageBot } from "./telegramService.js";
import {
  extractAccountNumber,
  extractTextAndNumber,
  formatDate,
} from "../utils/index.js";
import dotenv from "dotenv";

dotenv.config();

const readExcelFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const decodedBuffer = iconv.decode(buffer, "win1251");
  const workbook = xlsx.read(decodedBuffer, { type: "string" });
  const sheetsNames = workbook.SheetNames;
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetsNames[1]], {
    raw: false,
  });
  return sheetData;
};

const makeBody = async (file) => {
  const filePath = path.join(config.downloadPath, file);
  let createdAt = moment().tz("Asia/Tashkent").format("YYYY-MM-DD HH:mm:ss");
  let sendData = [];
  const rawData = readExcelFile(filePath);

  for (let i = 0; i < rawData.length - 1; i++) {
    const data = rawData[i];

    let amountDebit =
      data["Оборот Дебет"].length > 1
        ? parseFloat(data["Оборот Дебет"].replace(/\s/g, ""))
        : 0;
    let amountCredit =
      data["Оборот Кредит"].length > 1
        ? parseFloat(data["Оборот Кредит"].replace(/\s/g, ""))
        : 0;
    const { account_number, inn, name } = extractTextAndNumber(
      data["Cчет/ИНН"]
    );

    const body = {
      main_account_number: extractAccountNumber(file),
      date: formatDate(data["Дата"]),
      status: "added",
      document_code: data["№ док"],
      MFO: data["МФО"].length < 5 ? data["МФО"].padStart(5, "0") : data["МФО"],
      value: amountCredit > 0 ? amountCredit : -1 * amountDebit,
      input_value: amountCredit,
      output_value: amountDebit,
      account_number: account_number,
      account_title: name,
      account_INN: inn,
      title: data["Назначение платежа"],
      created_at: createdAt,
      updated_at: createdAt,
      base_account_number: account_number.substr(9, 8),
      automatic: false,
    };

    sendData.push(body);
  }

  return sendData;
};

const sendFilesData = async () => {
  const folderPath = config.downloadPath;
  try {
    if (!fs.existsSync(folderPath)) {
      console.log("❌ Papka mavjud emas:", folderPath);
      await sendMessageBot(`(Universal bank) ❌ Papka mavjud emas: ${folderPath}`);
      return;
    }

    const files = fs.readdirSync(folderPath).filter((file) => {
      return file.endsWith(".xls") || file.endsWith(".xlsx");
    });

    if (files.length === 0) {
      console.log("❌ Yuborish uchun fayl topilmadi.");
      await sendMessageBot("(Universal bank) ❌ Yuborish uchun fayl topilmadi.");
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
          { data: body },
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
        // await sendMessageBot(
        //   `${extractAccountNumber(file)} acount: ${
        //     responseExternalApi.data.message
        //   }`
        // );
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
        const errorMessage = `❌ ${error}` ?? "❌ No'malum xatolik";
        await sendMessageBot(`(Universal bank) ${errorMessage}`);
        continue;
      }
    }
  } catch (error) {
    console.error("❌ Excel fayl yuklashda xatolik:", error.message);
  }
};

export default sendFilesData;
