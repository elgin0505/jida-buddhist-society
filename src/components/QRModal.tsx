"use client";

import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string | null;
  memberName: string;
  memberId: string;
}

export function QRModal({ isOpen, onClose, qrCodeUrl, memberName, memberId }: QRModalProps) {
  const downloadPdf = () => {
    if (!qrCodeUrl) return;
    
    // 创建一个 A4 纸大小的 PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.setFontSize(24);
    pdf.setTextColor(40, 40, 40);
    pdf.text("Jida Buddhist Society", 105, 40, { align: "center" });
    
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${memberName} (${memberId})`, 105, 50, { align: "center" });

    // 居中放置 QR 码
    const qrSize = 100;
    const x = (210 - qrSize) / 2;
    const y = 70;
    
    pdf.addImage(qrCodeUrl, "PNG", x, y, qrSize, qrSize);
    
    pdf.setFontSize(12);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Please present this QR code for event check-in.", 105, 185, { align: "center" });

    pdf.save(`JBS_QRCode_${memberId}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-ocher-light/30 hover:text-charcoal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <h3 className="text-xl font-bold text-charcoal">我的签到凭证</h3>
              <p className="mt-1 text-sm text-muted">出示此二维码以便管理员扫描</p>
            </div>

            <div className="my-8 flex justify-center">
              <div className="rounded-2xl border-4 border-golden-deep/20 p-2 shadow-inner bg-white">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48 object-contain" />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-golden-deep border-t-transparent" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={downloadPdf}
                disabled={!qrCodeUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-golden-deep py-3.5 font-bold text-white shadow-lg shadow-golden-deep/30 transition-all hover:bg-golden-deep/90 active:scale-95 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                下载为 PDF
              </button>
              
              <button
                onClick={onClose}
                className="w-full rounded-xl py-3 text-sm font-semibold text-muted transition-colors hover:bg-ocher-light/30 hover:text-charcoal"
              >
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
