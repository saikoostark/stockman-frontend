import { expect, test } from "@playwright/test";

const unique = `e2e_${Date.now().toString(36)}`;
const password = "S3curePass!2026";

test("register, fund wallet, browse markets, switch to Arabic, logout", async ({ page }) => {
  // 1. Register a fresh user (English locale default).
  await page.goto("/en/register");
  await page.getByLabel("Username").fill(unique);
  await page.getByLabel("Email").fill(`${unique}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // 2. Land on the dashboard with a greeting.
  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.getByText(new RegExp(unique))).toBeVisible();

  // Wallet balances render (EGP and USDT shown separately).
  await expect(page.getByText("EGP")).toBeVisible();
  await expect(page.getByText("USDT")).toBeVisible();

  // 3. Top up the EGP wallet via the wallets page.
  await page.getByRole("link", { name: "Wallets" }).click();
  await expect(page).toHaveURL(/\/en\/wallets/);
  await page.getByRole("button", { name: "Top up" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Amount").fill("500");
  await dialog.getByLabel("Reason").fill("e2e top-up");
  await dialog.getByRole("button", { name: "Top up" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("500.00").first()).toBeVisible();

  // 4. Browse the markets list (instruments render).
  await page.getByRole("link", { name: "Markets" }).click();
  await expect(page).toHaveURL(/\/en\/markets/);
  await expect(page.getByText("BTCUSDT").first()).toBeVisible();

  // 5. Switch language to Arabic and confirm RTL + translated heading.
  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitem", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("الأسواق").first()).toBeVisible();

  // 6. Log out (profile menu → Log out) and land back on login.
  await page.getByRole("button", { name: "الملف الشخصي" }).click();
  await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/login/);
});
