import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";
import configFile from "./src/config/index.js";
import fetchUsers from "./src/services/fetchUsers.js";

export default defineConfig({
  e2e: {
    defaultBrowser: "chrome",
    specPattern: "src/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    downloadsFolder: configFile.downloadPath,
    env: {
      SITE_URL: configFile.bankUrl,
      CASH_URL: configFile.cashUrl,
      CASH_USERNAME: configFile.cashUsername,
      CASH_PASSWORD: configFile.cashPassword,
      FROM_DATE: configFile.fromDate,
      TO_DATE: configFile.toDate,
      OLD_FILE_NAME: "Accont_payments.xlsx",
      USERS: [
        {
          id: 39,
          username: "UBANKQ925",
          password: "asdf123456+",
          bank_id: 5,
          bank_name: "UNIVERSALBANK",
          accounts: [
            {
              aloqabank_login_id: 39,
              account_number: "20208000105324093002",
            },
          ],
        },
        // {
        //   id: 40,
        //   username: "UBANKQ926",
        //   password: "asdf123456+",
        //   bank_id: 5,
        //   bank_name: "UNIVERSALBANK",
        //   accounts: [
        //     {
        //       aloqabank_login_id: 40,
        //       account_number: "20208000205324182003",
        //     },
        //   ],
        // },
      ],
    },
    async setupNodeEvents(on, config) {
      const downloadsFolder = config.downloadsFolder;
      // config.env.USERS = await fetchUsers();

      on("task", {
        renameFile({ account_number }) {
          const oldName = config.env.OLD_FILE_NAME;
          const newName =
            config.env.FROM_DATE == config.env.TO_DATE
              ? `agrobank_${account_number}_${config.env.FROM_DATE}.xlsx`
              : `agrobank_${account_number}_${config.env.FROM_DATE}_${config.env.TO_DATE}.xlsx`;
          const oldPath = path.join(downloadsFolder, oldName);
          const newPath = path.join(downloadsFolder, newName);

          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            return `✅ Fayl o‘zgartirildi: ${newPath}`;
          }
          return `❌ Fayl topilmadi: ${oldName}`;
        },
      });

      on("after:run", () => {
        const downloadsHtmlPath = path.join(downloadsFolder, "downloads.html");

        if (fs.existsSync(downloadsHtmlPath)) {
          fs.unlinkSync(downloadsHtmlPath);
          console.log("🗑️ `downloads.html` o‘chirildi.");
        }
      });

      return config;
    },
  },
});
