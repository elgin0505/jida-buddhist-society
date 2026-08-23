import nodemailer from "nodemailer";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  技大佛学会 - 禅意邮件发送服务 (Nodemailer Transporter)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export function getEmailTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

interface SendResetEmailParams {
  to: string;
  code: string;
  name?: string;
}

/**
 * 发送禅意风格的重置密码 OTP 验证码邮件
 */
export async function sendPasswordResetEmail({ to, code, name = "修行者" }: SendResetEmailParams) {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER;
  const transporter = getEmailTransporter();

  // 如果未配置 SMTP，在开发控制台输出模拟日志，便于本地调试
  if (!transporter || !user) {
    console.warn("\n⚠️ [Mailer Warning] 未检测到 EMAIL_USER 或 EMAIL_APP_PASSWORD 环境变量！");
    console.warn(`📩 [Mock Email] 正在向 <${to}> 发送模拟重置验证码: 【${code}】 (10分钟内有效)\n`);
    return {
      success: true,
      mocked: true,
      message: "邮件服务未配置环境变量，已在控制台输出模拟验证码",
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>重置您的账户密码 - 技大佛学会</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F6F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(184, 134, 11, 0.12); border: 1px solid #EADBBA;">
          
          <!-- 顶部金色禅意横幅 -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #C9A227 0%, #A87910 100%); padding: 36px 24px 28px;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 8px;">🪷</div>
              <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 2px;">技大佛学会</h1>
              <p style="color: rgba(255, 255, 255, 0.88); margin: 6px 0 0; font-size: 13px; letter-spacing: 1px;">清净心 · 正念觉照 · 重置密码</p>
            </td>
          </tr>

          <!-- 正文区域 -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <p style="font-size: 16px; color: #2C2825; margin: 0 0 16px; font-weight: 600;">
                尊敬的 ${name} 同修，阿弥陀佛：
              </p>
              <p style="font-size: 14px; line-height: 1.7; color: #5C5549; margin: 0 0 24px;">
                我们收到了您重置“技大佛学会”修持账户密码的申请。请在重置页面输入下方 6 位验证码以完成身份验证：
              </p>

              <!-- 验证码卡片 -->
              <div style="background: linear-gradient(135deg, #FBF8EE 0%, #F5EED3 100%); border: 2px dashed #C9A227; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 12px; font-weight: 600; color: #8A6D14; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">一次性安全验证码 (OTP)</span>
                <span style="display: inline-block; font-size: 36px; font-weight: 800; color: #9E740B; letter-spacing: 8px; font-family: monospace, Consolas, Courier;">
                  ${code}
                </span>
                <span style="display: block; font-size: 12px; color: #A19277; margin-top: 8px;">⏱️ 验证码将在 <strong>10 分钟</strong> 内有效</span>
              </div>

              <p style="font-size: 13px; line-height: 1.6; color: #8A8170; margin: 24px 0 0; border-top: 1px solid #EFEAE0; padding-top: 18px;">
                ⚠️ <strong>安全提示</strong>：此验证码用于重设您的账户凭证，请勿向任何人泄露。若非您本人操作，请忽略此邮件，您的账户依然安全无虞。
              </p>
            </td>
          </tr>

          <!-- 底部落款 -->
          <tr>
            <td align="center" style="background-color: #FAF8F2; padding: 20px 24px; border-top: 1px solid #EADBBA;">
              <p style="font-size: 12px; color: #A69E8F; margin: 0 0 4px;">技大佛学会 · 数字化弘法小组 敬启</p>
              <p style="font-size: 11px; color: #C4BDAF; margin: 0;">愿一切有情，身心自在，福慧双增 🙏</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const info = await transporter.sendMail({
    from: `"技大佛学会" <${user}>`,
    to,
    subject: "【技大佛学会】清净心 · 重置您的账户密码",
    text: `尊敬的 ${name} 同修：\n\n您正在申请重置密码，您的 6 位验证码为：【${code}】（10分钟内有效）。\n\n若非本人操作，请忽略此邮件。\n\n技大佛学会 敬启`,
    html: htmlContent,
  });

  return { success: true, messageId: info.messageId };
}
