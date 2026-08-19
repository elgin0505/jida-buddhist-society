import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// 目标 Google Sheet ID
const SHEET_ID = "1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc";

export interface SyncUserPayload {
  id?: string;
  memberId?: string;
  memberCode?: string;
  name: string;
  email: string;
  birthday?: string | Date | null;
  createdAt?: string | Date;
  totalPoints?: number;
}

export async function syncUserToGoogleSheet(user: SyncUserPayload) {
  try {
    const clientEmail =
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL ||
      process.env.GOOGLE_CLIENT_EMAIL ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey =
      process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
      process.env.GOOGLE_PRIVATE_KEY;
    const privateKey = rawKey ? (rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey) : undefined;

    if (!clientEmail || !privateKey) {
      console.warn("⚠️ [GoogleSheetsSync] 缺少 Google 凭据，跳过同步");
      return;
    }

    const serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // 优先根据 gid=1560445821 获取指定 Tab，或首个 Tab
    const sheet = doc.sheetsById[1560445821] || doc.sheetsByIndex[0];

    // 格式化注册时间 (Asia/Kuala_Lumpur 时区) YYYY-MM-DD HH:mm
    const dateObj = user.createdAt ? new Date(user.createdAt) : new Date();
    const formattedDate = dateObj
      .toLocaleString("zh-CN", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "-");

    let birthdayStr = "未填写";
    if (user.birthday) {
      const bDate = new Date(user.birthday);
      birthdayStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(
        bDate.getDate()
      ).padStart(2, "0")}`;
    }

    // 严格按照 6 列数据映射:
    // [1. 会员ID, 2. 姓名, 3. 邮箱, 4. 出生日期, 5. 注册时间, 6. 初始积分]
    const newRow = [
      user.memberCode || user.memberId || user.id || "",
      user.name,
      user.email,
      birthdayStr,
      formattedDate,
      user.totalPoints ?? 0,
    ];

    await sheet.addRow(newRow);
    console.log(
      `✅ [GoogleSheetsSync] 成功同步新学员 [${user.memberCode || user.memberId || user.id}] ${user.name} 至 Google Sheet`
    );
  } catch (error: any) {
    // 捕获所有异常，保证主注册业务流程不受任何阻断
    console.error("❌ [GoogleSheetsSync] Google Sheets 同步失败:", error?.message || error);
  }
}
