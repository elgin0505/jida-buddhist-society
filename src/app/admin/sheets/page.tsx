"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Badge } from "@/components/ui";

const GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc/edit?gid=1560445821#gid=1560445821";

const APPS_SCRIPT_CODE = `/**
 * 技大佛学会 (JBS) - Google Sheets Apps Script Webhook
 * 部署说明：
 * 1. 在表格菜单点击【扩展程序 (Extensions)】 -> 【Apps 脚本 (Apps Script)】
 * 2. 粘贴此代码并覆盖全部内容
 * 3. 点击【部署 (Deploy)】 -> 【新建部署 (New deployment)】 -> 选择【Web 应用】
 * 4. 设置【谁可以访问 (Who has access)】为【任何人 (Anyone)】
 * 5. 点击部署，复制生成的 Web 应用网址 (URL)
 */

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'ping';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: 'Google Sheets 联通正常',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'getMembers') {
      var sheet = getOrCreateSheet(ss, 'Members', ['Member ID', '姓名 (Name)', '邮箱 (Email)', '总积分 (Total Points)', '更新时间 (Updated At)']);
      var data = sheet.getDataRange().getValues();
      var rows = data.slice(1);
      var members = rows.map(function(r) {
        return {
          memberId: String(r[0] || '').trim(),
          name: String(r[1] || '').trim(),
          email: String(r[2] || '').trim(),
          totalPoints: Number(r[3]) || 0,
          updatedAt: r[4] ? new Date(r[4]).toISOString() : null,
        };
      }).filter(function(m) { return m.memberId; });
      return jsonResponse({ success: true, members: members });
    }

    if (action === 'getEvents') {
      var sheet = getOrCreateSheet(ss, 'Events', ['活动名称 (Event Name)', '日期时间 (DateTime)', '地点 (Location)', '积分 (Points)', '描述 (Description)']);
      var data = sheet.getDataRange().getValues();
      var rows = data.slice(1);
      var events = rows.map(function(r) {
        return {
          name: String(r[0] || '').trim(),
          dateTime: r[1] ? new Date(r[1]).toISOString() : null,
          location: String(r[2] || '').trim(),
          points: Number(r[3]) || 1,
          description: String(r[4] || '').trim(),
        };
      }).filter(function(ev) { return ev.name; });
      return jsonResponse({ success: true, events: events });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'logAttendance') {
      var d = payload.data;
      var sheet = getOrCreateSheet(ss, 'Attendance', ['时间 (Timestamp)', '会员编号 (Member ID)', '姓名 (Name)', '活动名称 (Event Name)', '获得积分 (Points Earned)']);
      var timeStr = d.timestamp ? new Date(d.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' });
      sheet.appendRow([timeStr, d.memberId, d.memberName || '', d.eventName, d.pointsEarned || 1]);
      updateMemberPointsInSheet(ss, d.memberId, Number(d.pointsEarned || 1));
      return jsonResponse({ success: true, message: '签到已同步到 Google Sheet' });
    }

    if (action === 'logRedemption') {
      var d = payload.data;
      var sheet = getOrCreateSheet(ss, 'Redemptions', ['时间 (Timestamp)', '会员编号 (Member ID)', '姓名 (Name)', '兑换奖品 (Reward)', '消耗积分 (Points Spent)']);
      var timeStr = d.timestamp ? new Date(d.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' });
      sheet.appendRow([timeStr, d.memberId, d.memberName || '', d.rewardName, d.pointsSpent || 0]);
      updateMemberPointsInSheet(ss, d.memberId, -Number(d.pointsSpent || 0));
      return jsonResponse({ success: true, message: '兑换已同步到 Google Sheet' });
    }

    if (action === 'syncMembers') {
      var members = payload.members || [];
      var sheet = getOrCreateSheet(ss, 'Members', ['Member ID', '姓名 (Name)', '邮箱 (Email)', '总积分 (Total Points)', '更新时间 (Updated At)']);
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      if (members.length > 0) {
        var rows = members.map(function(m) {
          return [m.memberId, m.name, m.email, m.totalPoints, m.updatedAt ? new Date(m.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })];
        });
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }
      return jsonResponse({ success: true, count: members.length });
    }

    if (action === 'syncEvents') {
      var events = payload.events || [];
      var sheet = getOrCreateSheet(ss, 'Events', ['活动名称 (Event Name)', '日期时间 (DateTime)', '地点 (Location)', '积分 (Points)', '描述 (Description)']);
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      if (events.length > 0) {
        var rows = events.map(function(ev) {
          return [ev.name, ev.dateTime ? new Date(ev.dateTime).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : '', ev.location || '', ev.points || 1, ev.description || ''];
        });
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }
      return jsonResponse({ success: true, count: events.length });
    }

    if (action === 'syncRewards') {
      var rewards = payload.rewards || [];
      var sheet = getOrCreateSheet(ss, 'Rewards', ['奖品名称 (Reward Name)', '所需积分 (Points Required)', '库存 (Stock)', '描述 (Description)']);
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
      if (rewards.length > 0) {
        var rows = rewards.map(function(rw) {
          return [rw.name, rw.pointsRequired || 0, rw.stock || 0, rw.description || ''];
        });
        sheet.getRange(2, 1, rows.length, 4).setValues(rows);
      }
      return jsonResponse({ success: true, count: rewards.length });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function updateMemberPointsInSheet(ss, memberId, deltaPoints) {
  try {
    var sheet = ss.getSheetByName('Members');
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(memberId).trim()) {
        var currentPoints = Number(data[i][3]) || 0;
        sheet.getRange(i + 1, 4).setValue(Math.max(0, currentPoints + deltaPoints));
        sheet.getRange(i + 1, 5).setValue(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }));
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#B45309');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

export default function AdminSheetsPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [status, setStatus] = useState<{
    configured: boolean;
    connected: boolean;
    message: string;
    spreadsheetName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取已保存的 Webhook URL
    const saved = localStorage.getItem("jbs_google_sheet_webhook_url");
    if (saved) {
      setWebhookUrl(saved);
      checkConnection(saved);
    } else {
      checkConnection();
    }
  }, []);

  const checkConnection = async (customUrl?: string) => {
    setLoading(true);
    try {
      const query = customUrl ? `?url=${encodeURIComponent(customUrl)}` : "";
      const res = await fetch(`/api/sheets${query}`);
      const data = await res.json();
      setStatus({
        configured: Boolean(customUrl || data.configured),
        connected: data.connection?.connected ?? false,
        message: data.connection?.message || "未连接",
        spreadsheetName: data.connection?.spreadsheetName,
      });
    } catch {
      setStatus({
        configured: false,
        connected: false,
        message: "检测连通性失败",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = () => {
    if (webhookUrl.trim()) {
      localStorage.setItem("jbs_google_sheet_webhook_url", webhookUrl.trim());
    } else {
      localStorage.removeItem("jbs_google_sheet_webhook_url");
    }
    checkConnection(webhookUrl.trim());
    setActionMessage({
      type: "success",
      text: "Webhook 网址已保存，正在测试连通性...",
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePushAll = async () => {
    setSyncing("push");
    setActionMessage(null);
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pushAll",
          webhookUrl: webhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: data.message });
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "推送数据失败，请确认 Webhook URL 是否有效",
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "推送失败";
      setActionMessage({ type: "error", text: msg });
    } finally {
      setSyncing(null);
    }
  };

  const handlePullMembers = async () => {
    setSyncing("pull");
    setActionMessage(null);
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pullMembers",
          webhookUrl: webhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: data.message });
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "拉取数据失败",
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "拉取失败";
      setActionMessage({ type: "error", text: msg });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Google 表格数据同步"
        subtitle="将出勤签到、会员积分与奖品兑换实时双向连接至 Google Sheets"
        action={
          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <svg
              className="h-4 w-4 text-jade"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            打开目标 Google 表格
          </a>
        }
      />

      {/* 状态与配置卡片 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-ocher/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-charcoal">
                Webhook 连通配置
              </h3>
              <p className="text-xs text-muted mt-0.5">
                目标表格 ID:{" "}
                <code className="rounded bg-ocher-light/40 px-1.5 py-0.5 font-mono text-golden-rich">
                  1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc
                </code>
              </p>
            </div>
            {status && (
              <Badge variant={status.connected ? "jade" : "carmine"}>
                {status.connected ? "● 已连接" : "○ 未连接 / 待配置"}
              </Badge>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-charcoal">
              Google Apps Script Webhook 网址 (Web App URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 rounded-xl border border-ocher/30 bg-white/80 px-3.5 py-2.5 text-sm font-mono text-charcoal focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
              />
              <button
                onClick={handleSaveWebhook}
                disabled={loading}
                className="btn-primary shrink-0"
              >
                {loading ? "测试中..." : "保存并测试"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {status?.message}
              {status?.spreadsheetName && ` (表格: ${status.spreadsheetName})`}
            </p>
          </div>

          {actionMessage && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                actionMessage.type === "success"
                  ? "bg-jade/10 text-jade"
                  : "bg-carmine/10 text-carmine"
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {/* 快捷数据同步操作 */}
          <div className="border-t border-ocher/10 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-charcoal">
              一键数据同步
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePushAll}
                disabled={Boolean(syncing) || !status?.connected}
                className="btn-jade text-sm flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {syncing === "push"
                  ? "正在推送..."
                  : "推送全部数据到 Google 表格"}
              </button>

              <button
                onClick={handlePullMembers}
                disabled={Boolean(syncing) || !status?.connected}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {syncing === "pull"
                  ? "正在拉取..."
                  : "从 Google 表格同步会员"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              💡 提示：日常会员签到与积分兑换将自动实时记录进 Google 表格的 Attendance 与 Redemptions 分页中。
            </p>
          </div>
        </Card>

        {/* 表格分页概览 */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-charcoal">
            Google 表格分页结构
          </h3>
          <p className="text-xs text-muted">
            脚本会自动在您的 Google Sheet 中创建并维护以下分页：
          </p>

          <ul className="space-y-2.5 text-xs">
            <li className="flex items-start gap-2 rounded-lg bg-ocher-light/20 p-2.5">
              <span className="rounded bg-golden-deep/10 px-1.5 py-0.5 font-bold text-golden-rich">
                Members
              </span>
              <span className="text-muted">
                会员编号、姓名、邮箱、当前总积分
              </span>
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-jade/10 p-2.5">
              <span className="rounded bg-jade/20 px-1.5 py-0.5 font-bold text-jade">
                Attendance
              </span>
              <span className="text-muted">
                签到时间、会员ID、姓名、活动名称、获得积分
              </span>
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-sapphire/10 p-2.5">
              <span className="rounded bg-sapphire/20 px-1.5 py-0.5 font-bold text-sapphire">
                Events
              </span>
              <span className="text-muted">活动名称、时间、地点、活动积分</span>
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-carmine/10 p-2.5">
              <span className="rounded bg-carmine/20 px-1.5 py-0.5 font-bold text-carmine">
                Redemptions
              </span>
              <span className="text-muted">
                兑换时间、会员ID、兑换奖品、消耗积分
              </span>
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-ocher-light/20 p-2.5">
              <span className="rounded bg-golden-deep/10 px-1.5 py-0.5 font-bold text-golden-rich">
                Rewards
              </span>
              <span className="text-muted">奖品名称、所需积分、库存</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* 3分钟配置教程 */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-ocher/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-charcoal">
              快速配置指南 (只需 3 步)
            </h3>
            <p className="text-xs text-muted">
              无需任何复杂设置，使用 Google Apps Script 即可完成即时连接
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="btn-jade self-start sm:self-auto flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? "✓ 已复制代码！" : "一键复制 Apps Script 代码"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-ocher/20 bg-warm-white/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-golden-rich font-bold text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-golden-deep/20 text-xs">
                1
              </span>
              打开表格 Apps Script
            </div>
            <p className="text-xs text-muted leading-relaxed">
              打开您的{" "}
              <a
                href={GOOGLE_SHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="text-golden-rich underline font-medium"
              >
                Google 表格
              </a>
              ，点击上方菜单栏中的 <strong>【扩展程序 (Extensions)】</strong> ➔{" "}
              <strong>【Apps 脚本 (Apps Script)】</strong>。
            </p>
          </div>

          <div className="rounded-xl border border-ocher/20 bg-warm-white/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-golden-rich font-bold text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-golden-deep/20 text-xs">
                2
              </span>
              粘贴代码并部署
            </div>
            <p className="text-xs text-muted leading-relaxed">
              将点击上方按钮复制的代码粘贴进编辑器并保存。点击右上角{" "}
              <strong>【部署 (Deploy)】➔【新建部署 (New deployment)】</strong>。
              选择 <strong>【Web 应用 (Web app)】</strong>，将 <strong>【谁可以访问】</strong> 设置为{" "}
              <strong className="text-carmine">【任何人 (Anyone)】</strong>。
            </p>
          </div>

          <div className="rounded-xl border border-ocher/20 bg-warm-white/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-golden-rich font-bold text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-golden-deep/20 text-xs">
                3
              </span>
              填入网址并保存
            </div>
            <p className="text-xs text-muted leading-relaxed">
              复制生成的 <strong>Web 应用网址</strong>（以{" "}
              <code>https://script.google.com/macros/s/.../exec</code> 结尾），粘贴到本页面的输入框中并点击【保存并测试】即可！
            </p>
          </div>
        </div>

        {/* 代码展示框 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
            <span>Google Apps Script 代码预览</span>
            <span className="text-muted font-normal">
              亦保存在项目根目录的 <code>google-apps-script/Code.js</code>
            </span>
          </div>
          <pre className="max-h-60 overflow-y-auto rounded-xl bg-charcoal p-4 text-xs font-mono text-warm-white/90 leading-relaxed">
            <code>{APPS_SCRIPT_CODE}</code>
          </pre>
        </div>
      </Card>
    </div>
  );
}
