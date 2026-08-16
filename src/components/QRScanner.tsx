"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      )
      .then(() => setScanning(true))
      .catch((err) => {
        setError(
          err?.message?.includes("NotAllowed")
            ? "请允许相机权限以扫描二维码"
            : "无法启动相机，请检查设备权限"
        );
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-ocher/20 px-6 py-4">
          <h3 className="text-lg font-semibold text-charcoal">扫描会员二维码</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-ocher-light/30 hover:text-charcoal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="rounded-xl bg-carmine/10 p-4 text-center text-sm text-carmine">
              {error}
            </div>
          ) : (
            <>
              <div
                id="qr-reader"
                className="overflow-hidden rounded-xl [&>video]:rounded-xl"
              />
              {scanning && (
                <p className="mt-3 text-center text-xs text-muted">
                  将会员二维码对准扫描框
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
