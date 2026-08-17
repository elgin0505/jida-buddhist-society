"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string | null;
  memberName: string;
  memberId: string;
  totalPoints?: number;
}

export function QRModal({
  isOpen,
  onClose,
  qrCodeUrl,
  memberName,
  memberId,
  totalPoints = 0,
}: QRModalProps) {
  const [downloading, setDownloading] = useState(false);

  // 使用 HTML5 Canvas 绘制精美的禅意实体会员卡并导出为高清 PDF / 图片
  const generateCanvasCard = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 设置高清分辨率 (300 DPI 比例)
      const width = 800;
      const height = 1100;
      canvas.width = width;
      canvas.height = height;

      // 1. 禅意宣纸背景
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#faf7f2");
      bgGrad.addColorStop(0.5, "#f7f0e3");
      bgGrad.addColorStop(1, "#f2e7d3");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. 双层金色复古边框
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 6;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      ctx.strokeStyle = "rgba(201, 162, 39, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, width - 92, height - 92);

      // 四角禅意装饰纹
      const drawCorner = (x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.strokeStyle = "#b8860b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(24, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 24);
        ctx.stroke();
        ctx.restore();
      };
      drawCorner(56, 56, 0);
      drawCorner(width - 56, 56, 90);
      drawCorner(width - 56, height - 56, 180);
      drawCorner(56, height - 56, 270);

      // 3. 顶部标题
      ctx.fillStyle = "#854d0e";
      ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("马来西亚技术大学 佛学会", width / 2, 120);

      ctx.fillStyle = "#b8860b";
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("JIDA BUDDHIST SOCIETY · 会员电子签到凭证", width / 2, 160);

      // 分割线
      ctx.strokeStyle = "rgba(184, 134, 11, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 190);
      ctx.lineTo(width - 120, 190);
      ctx.stroke();

      // 4. 会员信息区块
      ctx.fillStyle = "#262626";
      ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif";
      ctx.fillText(memberName, width / 2, 260);

      ctx.fillStyle = "#737373";
      ctx.font = "bold 24px monospace";
      ctx.fillText(`ID: ${memberId}`, width / 2, 305);

      ctx.fillStyle = "#2d6a4f";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(`累计功德积分: ${totalPoints} 分`, width / 2, 345);

      // 5. 绘制二维码
      if (qrCodeUrl) {
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.onload = () => {
          const qrSize = 420;
          const qrX = (width - qrSize) / 2;
          const qrY = 385;

          // 二维码白色衬底与外阴影框
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
          ctx.fill();
          ctx.strokeStyle = "#e8c872";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // 6. 底部提示语
          ctx.fillStyle = "#525252";
          ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif";
          ctx.fillText("出席佛学会活动时出示此码，即可完成签到", width / 2, 890);

          ctx.fillStyle = "#a3a3a3";
          ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.fillText("“常随佛学，广结善缘” · 技大佛学会", width / 2, 940);

          resolve(canvas);
        };
        qrImg.src = qrCodeUrl;
      } else {
        resolve(canvas);
      }
    });
  };

  const handleDownloadPdf = async () => {
    if (!qrCodeUrl) return;
    setDownloading(true);

    try {
      const canvas = await generateCanvasCard();
      const imgData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // A4 尺寸 210 x 297 mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      const cardWidth = 160;
      const cardHeight = (cardWidth * 1100) / 800; // 维持 800:1100 比例
      const x = (pdfWidth - cardWidth) / 2;
      const y = (pdfHeight - cardHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, cardWidth, cardHeight);
      pdf.save(`技大佛学会_签到凭证_${memberName}_${memberId}.pdf`);
    } catch {
      alert("生成 PDF 失败，请重试");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!qrCodeUrl) return;
    try {
      const canvas = await generateCanvasCard();
      const link = document.createElement("a");
      link.download = `技大佛学会_签到凭证_${memberName}_${memberId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("保存图片失败");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 420, damping: 25 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-warm-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center"
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-muted transition-colors hover:bg-ocher-light/30 hover:text-charcoal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* 顶栏图标 */}
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-golden-deep/15 text-golden-rich">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" strokeWidth="3" strokeLinecap="round" />
                <rect x="7" y="11" width="10" height="2" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-charcoal">会员电子签到码</h3>
            <p className="mt-1 text-xs text-muted">
              {memberName} · <span className="font-semibold text-golden-rich">{memberId}</span>
            </p>

            {/* 二维码高清展示区 */}
            <div className="my-6 flex justify-center">
              <div className="relative rounded-3xl border-4 border-golden-deep/25 bg-white p-4 shadow-[0_12px_32px_-6px_rgba(201,162,39,0.25)]">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="会员二维码"
                    className="h-56 w-56 sm:h-64 sm:w-64 object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-golden-deep border-t-transparent" />
                  </div>
                )}
                <div className="mt-2 text-center text-[11px] font-medium text-muted">
                  出示此二维码以便现场扫码签到
                </div>
              </div>
            </div>

            {/* 下载与操作按钮组 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={downloading || !qrCodeUrl}
                className="flex items-center justify-center gap-2 rounded-xl bg-golden-deep py-3 font-bold text-white shadow-lg shadow-golden-deep/25 transition-all hover:bg-golden-deep/90 active:scale-95 disabled:opacity-50 text-xs sm:text-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                {downloading ? "生成中..." : "下载高清 PDF"}
              </button>

              <button
                onClick={handleSaveImage}
                disabled={!qrCodeUrl}
                className="flex items-center justify-center gap-2 rounded-xl border border-ocher/40 bg-white/90 py-3 font-bold text-charcoal shadow-sm transition-all hover:bg-golden-deep/10 active:scale-95 text-xs sm:text-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                保存图片凭证
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-muted transition-colors hover:text-charcoal"
            >
              关闭窗口
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
