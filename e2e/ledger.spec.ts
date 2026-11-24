import { expect, test } from "@playwright/test";

test("give ৳5,000 credit and receive ৳3,000 leaves ৳2,000", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.clear());
  await page.getByTestId("login-phone").fill("01711345678");
  await page.getByTestId("login-password").fill("aadai123");
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto("/customers/cus_salma");
  await expect(page.getByTestId("party-balance")).toContainText("০");

  await page.getByTestId("entry-open-credit").click();
  await page.getByTestId("entry-amount").fill("5000");
  await page.getByTestId("entry-note").fill("পাইপ");
  await page.getByTestId("entry-save").click();
  await expect(page.getByTestId("party-balance")).toContainText("৫,০০০");

  await page.getByTestId("entry-open-payment").click();
  await page.getByTestId("entry-amount").fill("3000");
  await page.getByTestId("entry-save").click();
  await expect(page.getByTestId("party-balance")).toContainText("২,০০০");
});
