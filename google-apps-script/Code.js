/**
 * 技大佛学会 (JBS) - Google Sheets Apps Script Webhook
 * 
 * 部署说明：
 * 1. 打开您的 Google 表格 (https://docs.google.com/spreadsheets/d/1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc/edit)
 * 2. 点击上方菜单栏的【扩展程序 (Extensions)】 -> 【Apps 脚本 (Apps Script)】
 * 3. 将本文件中的所有代码复制并粘贴到编辑器中（覆盖原有内容）
 * 4. 点击右上角【部署 (Deploy)】 -> 【新建部署 (New deployment)】
 * 5. 点击齿轮图标选择【Web 应用 (Web app)】
 * 6. 设置说明：
 *    - 描述: JBS Sync Webhook
 *    - 执行身份: 我 (Me)
 *    - 谁可以访问: 任何人 (Anyone)  <-- 非常重要！
 * 7. 点击【部署 (Deploy)】并授权权限，复制生成的【Web 应用网址 (Web app URL)】
 * 8. 将该网址填入系统的 .env 文件中的 GOOGLE_SHEET_WEBHOOK_URL 或在管理后台中保存！
 */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: 'Google Sheets Apps Script 运行正常',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'getMembers') {
      const sheet = getOrCreateSheet(ss, 'Members', [
        'Member ID', '姓名 (Name)', '邮箱 (Email)', '总积分 (Total Points)', '更新时间 (Updated At)'
      ]);
      const data = sheet.getDataRange().getValues();
      const headers = data[0] || [];
      const rows = data.slice(1);
      const members = rows.map(r => ({
        memberId: String(r[0] || '').trim(),
        name: String(r[1] || '').trim(),
        email: String(r[2] || '').trim(),
        totalPoints: Number(r[3]) || 0,
        updatedAt: r[4] ? new Date(r[4]).toISOString() : null,
      })).filter(m => m.memberId);

      return jsonResponse({ success: true, members });
    }

    if (action === 'getEvents') {
      const sheet = getOrCreateSheet(ss, 'Events', [
        '活动名称 (Event Name)', '日期时间 (DateTime)', '地点 (Location)', '积分 (Points)', '描述 (Description)'
      ]);
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1);
      const events = rows.map(r => ({
        name: String(r[0] || '').trim(),
        dateTime: r[1] ? new Date(r[1]).toISOString() : null,
        location: String(r[2] || '').trim(),
        points: Number(r[3]) || 1,
        description: String(r[4] || '').trim(),
      })).filter(ev => ev.name);

      return jsonResponse({ success: true, events });
    }

    if (action === 'getRewards') {
      const sheet = getOrCreateSheet(ss, 'Rewards', [
        '奖品名称 (Reward Name)', '所需积分 (Points Required)', '库存 (Stock)', '描述 (Description)'
      ]);
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1);
      const rewards = rows.map(r => ({
        name: String(r[0] || '').trim(),
        pointsRequired: Number(r[1]) || 0,
        stock: Number(r[2]) || 0,
        description: String(r[3] || '').trim(),
      })).filter(rw => rw.name);

      return jsonResponse({ success: true, rewards });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 记录签到
    if (action === 'logAttendance') {
      const { memberId, memberName, eventName, pointsEarned, timestamp } = payload.data;
      const sheet = getOrCreateSheet(ss, 'Attendance', [
        '时间 (Timestamp)', '会员编号 (Member ID)', '姓名 (Name)', '活动名称 (Event Name)', '获得积分 (Points Earned)'
      ]);
      
      const timeStr = timestamp ? new Date(timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' });
      sheet.appendRow([timeStr, memberId, memberName || '', eventName, pointsEarned || 1]);
      
      // 更新 Members 表格中的积分
      updateMemberPointsInSheet(ss, memberId, Number(pointsEarned || 1));

      return jsonResponse({ success: true, message: '签到已同步到 Google Sheet' });
    }

    // 2. 记录奖品兑换
    if (action === 'logRedemption') {
      const { memberId, memberName, rewardName, pointsSpent, timestamp } = payload.data;
      const sheet = getOrCreateSheet(ss, 'Redemptions', [
        '时间 (Timestamp)', '会员编号 (Member ID)', '姓名 (Name)', '兑换奖品 (Reward)', '消耗积分 (Points Spent)'
      ]);
      
      const timeStr = timestamp ? new Date(timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' });
      sheet.appendRow([timeStr, memberId, memberName || '', rewardName, pointsSpent || 0]);
      
      // 扣除 Members 表格中的积分
      updateMemberPointsInSheet(ss, memberId, -Number(pointsSpent || 0));

      return jsonResponse({ success: true, message: '兑换已同步到 Google Sheet' });
    }

    // 3. 全量推送会员列表
    if (action === 'syncMembers') {
      const members = payload.members || [];
      const sheet = getOrCreateSheet(ss, 'Members', [
        'Member ID', '姓名 (Name)', '邮箱 (Email)', '总积分 (Total Points)', '更新时间 (Updated At)'
      ]);
      
      // 清空原有数据（保留表头）
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      }

      if (members.length > 0) {
        const rows = members.map(m => [
          m.memberId,
          m.name,
          m.email,
          m.totalPoints,
          m.updatedAt ? new Date(m.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })
        ]);
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }

      return jsonResponse({ success: true, count: members.length });
    }

    // 4. 全量推送活动列表
    if (action === 'syncEvents') {
      const events = payload.events || [];
      const sheet = getOrCreateSheet(ss, 'Events', [
        '活动名称 (Event Name)', '日期时间 (DateTime)', '地点 (Location)', '积分 (Points)', '描述 (Description)'
      ]);
      
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      }

      if (events.length > 0) {
        const rows = events.map(ev => [
          ev.name,
          ev.dateTime ? new Date(ev.dateTime).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }) : '',
          ev.location || '',
          ev.points || 1,
          ev.description || ''
        ]);
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }

      return jsonResponse({ success: true, count: events.length });
    }

    // 5. 全量推送奖品列表
    if (action === 'syncRewards') {
      const rewards = payload.rewards || [];
      const sheet = getOrCreateSheet(ss, 'Rewards', [
        '奖品名称 (Reward Name)', '所需积分 (Points Required)', '库存 (Stock)', '描述 (Description)'
      ]);
      
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
      }

      if (rewards.length > 0) {
        const rows = rewards.map(rw => [
          rw.name,
          rw.pointsRequired || 0,
          rw.stock || 0,
          rw.description || ''
        ]);
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
    const sheet = ss.getSheetByName('Members');
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(memberId).trim()) {
        const currentPoints = Number(data[i][3]) || 0;
        const newPoints = Math.max(0, currentPoints + deltaPoints);
        sheet.getRange(i + 1, 4).setValue(newPoints);
        sheet.getRange(i + 1, 5).setValue(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }));
        break;
      }
    }
  } catch (e) {
    console.error('Failed to update member points in sheet:', e);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    // 样式美化表头
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#B45309'); // 佛学会金色/赭色
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
