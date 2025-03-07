describe("File Download Test", () => {
  Cypress.env("USERS").forEach((user) => {
    it("Should login and download a file", () => {
      cy.visit(Cypress.env("SITE_URL"));

      cy.get('input[name="login"]').type(user.username);
      cy.get('input[name="password"]').type(user.password);
      cy.get("button#sButton").click();

      // JSESSIONID ni saqlash
      cy.getCookie("JSESSIONID")
        .should("exist")
        .then((cookie) => {
          cy.log("JSESSIONID saqlandi:", cookie.value);
        });

      // Отчеты bo'limiga o'tish
      cy.get("li").contains("Отчеты").click();
      cy.get("a[href='reports/reports.jsp']").should("be.visible").click();

      // Main iframe yuklanishini kutish
      cy.frameLoaded("iframe[name='mainContent']", { timeout: 15000 });

      // Network so'rovni ushlash uchun intercept qo'yish
      cy.intercept("POST", "**/right.jsp?repld=*").as("rightRequest");

      // Main iframe ichida ishlash
      cy.iframe("iframe[name='mainContent']").within(() => {
        // Left iframe yuklanishini kutish
        cy.frameLoaded("iframe.frameLeft", { timeout: 15000 }).then(() => {
          cy.iframe("iframe.frameLeft").within(() => {
            // Knopkani topish
            cy.get("#tbl")
              .contains("tr", "Выписка лицевых счетов")
              .should("be.visible")
              .then(($el) => {
                cy.log("Knopka topildi:", $el.text());

                // Pointer-eventsni o'chirish
                cy.window().then((win) => {
                  const element = $el[0];
                  element.style.pointerEvents = "auto"; // Interaktivlikni yoqish
                  cy.log("Pointer-events: auto qilindi");

                  // Double click hodisasini emulyatsiya qilish (onAction uchun)
                  const dblclickEvent = new win.Event("dblclick", {
                    bubbles: true,
                    cancelable: true,
                    view: win,
                  });
                  element.dispatchEvent(dblclickEvent);
                  cy.log("Double click hodisasi dispatch qilindi");

                  // Agar onAction ishlamasa, go() funksiyasini to'g'ridan-to'g'ri chaqirish
                  cy.window().then((win) => {
                    const form = win.document.querySelector(
                      "form[name='tblForm']"
                    );
                    if (form) {
                      cy.log("tblForm topildi:", form);
                      // go() funksiyasini to'g'ri parametrlar bilan chaqirish
                      win.go({ form: form, param: { submit: 1 } });
                      cy.log("go() funksiyasi tblForm bilan chaqirildi");
                    } else {
                      cy.log("tblForm topilmadi, barcha formlarni tekshirish:");
                      cy.window().then((win) => {
                        cy.log("Barcha formalar:", win.document.forms);
                      });
                    }
                  });

                  // Server javobini kutish
                  cy.wait(5000); // Serverdan javob kelishini kutish

                  // Network so'rovni tekshirish
                  cy.wait("@rightRequest", { timeout: 15000 }).then(
                    (interception) => {
                      cy.log(
                        "So'rov muvaffaqiyatli ushlandi:",
                        interception.request.url
                      );
                    }
                  );

                  // Right iframe yuklanishini tekshirish
                  cy.frameLoaded('iframe[name="right"]', {
                    timeout: 15000,
                  }).should("exist");
                });
              });
          });
        });
      });
    });
  });
});
