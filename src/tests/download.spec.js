import { test } from "@playwright/test";
import config from "../config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const users = JSON.parse(process.env.USERS);
const failedUsersFile = path.join(config.downloadPath, "failed_users.json");

function saveFailedUser(user) {
  let failedUsers = [];
  if (fs.existsSync(failedUsersFile)) {
    const content = fs.readFileSync(failedUsersFile, "utf8");
    try {
      failedUsers = JSON.parse(content);
    } catch (e) {
      failedUsers = [];
    }
  }

  // user allaqachon yozilgan bo'lsa, takrorlanmasin
  if (!failedUsers.find((u) => u.username === user.username)) {
    failedUsers.push(user);
    fs.writeFileSync(failedUsersFile, JSON.stringify(failedUsers, null, 2));
  }
}

test.describe("File Download Test", () => {
  users.forEach((user) => {
    test(`Should login and download a file for user ${user.username}`, async ({
      page,
    }) => {
      try {
        await page.goto("/", { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.locator('input[name="login"]').fill(user.username);
        await page.locator('input[name="password"]').fill(user.password);
        await page.locator("#sButton").click();

        const errorPopup = page.locator(
          "div.z-messagebox-window.z-window-highlighted.z-window-highlighted-shadow"
        );
        if ((await errorPopup.count()) > 0) {
          const buttons = errorPopup.locator(
            "button.z-messagebox-btn.z-button-os"
          );
          for (const button of await buttons.all()) {
            await button.click();
          }
        }

        await page.locator("span:has-text('Отчеты')").hover();
        await page.click("a:has-text('Отчеты')");
        await page.waitForTimeout(1000);

        const frameReport = page.frame({ name: "left" });
        await frameReport
          .getByRole("cell", { name: "021", exact: true })
          .click();
        await frameReport.waitForTimeout(1000);

        const frameForm = page.frame({ name: "right" });

        for (const account of user.accounts) {
          await frameForm.locator("#Date_Begin").fill(config.fromDate);
          await frameForm.locator("#Date_End").fill(config.toDate);
          await frameForm.locator("#searchInput").click();

          const selectOptionId = "select#Acc";
          const options = await frameForm
            .locator(`${selectOptionId} option`)
            .all();

          let selectOptionValue = null;
          for (const option of options) {
            const value = await option.getAttribute("value");
            if (value && value.endsWith(account.account_number)) {
              selectOptionValue = value;
              break;
            }
          }

          if (!selectOptionValue) {
            throw new Error(
              `Account number ${account.account_number} not found`
            );
          }

          await frameForm.selectOption(selectOptionId, selectOptionValue);
          await frameForm
            .locator(`${selectOptionId} option[value="${selectOptionValue}"]`)
            .click();
          await page.waitForTimeout(3000);

          await frameForm.locator("#mime").click();
          await frameForm.selectOption("select#mime", "EXCEL");

          const downloadPromise = page.waitForEvent("download");
          await frameForm.locator("#runreport").click();
          const download = await downloadPromise;
          const fileExtension = download.suggestedFilename().split(".").pop();
          const fileName = `universalbank_${account.account_number}_${config.fromDate}_to_${config.toDate}.${fileExtension}`;
          const filePath = path.join(config.downloadPath, fileName);

          await download.saveAs(filePath);
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.error(
          `❌ Test failed for user ${user.username}:`,
          error.message
        );
        saveFailedUser({
          username: user.username,
          bank_name: user.bank_name,
          accounts: user.accounts,
        });
        throw error; // Testni fail qilish uchun qaytadan throw qilamiz
      }
    });
  });
});
