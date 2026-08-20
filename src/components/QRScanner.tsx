"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const containerId = useRef("qr-reader-box-" + Math.random().toString(36).substring(2, 9)).current;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const container = document.getElementById(containerId);
        if (!container || !isMounted) return;
        container.innerHTML = "";

        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        // 获取设备列表，精准锁定单一后置镜头（避免多镜头机型启动多路画面）
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (!isMounted) return;

        let cameraConfig: any = { facingMode: "environment" };
        if (devices && devices.length > 0) {
          const rearCam = devices.find((d) => {
            const label = d.label.toLowerCase();
            return (
              label.includes("back") ||
              label.includes("rear") ||
              label.includes("environment") ||
              label.includes("0")
            );
          });
          const targetDevice = rearCam || devices[0];
          cameraConfig = { deviceId: { exact: targetDevice.id } };
        }

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              onScan(decodedText);
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode
                  .stop()
                  .then(() => {
                    html5QrCode?.clear();
                  })
                  .catch(() => {});
              }
            }
          },
          () => {} // 忽略每帧未检测到码时的内部异常
        );

        if (isMounted) {
          setScanning(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err?.message?.includes("NotAllowed") || err?.name === "NotAllowedError"
              ? "请允许相机权限以扫描二维码"
              : "无法启动相机，请检查设备权限或确保无其他程序占用镜头"
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current
              .stop()
              .then(() => {
                scannerRef.current?.clear();
                const el = document.getElementById(containerId);
                if (el) el.innerHTML = "";
              })
              .catch(() => {});
          } else {
            scannerRef.current.clear();
            const el = document.getElementById(containerId);
            if (el) el.innerHTML = "";
          }
        } catch {}
      }
    };
  }, [containerId, onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md overflow-hidden p-0 border-2 border-golden-deep/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ocher/20 px-6 py-4 bg-gradient-to-r from-warm-white to-warm-cream/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">📷</span>
            <h3 className="text-base font-bold text-charcoal">扫描二维码签到</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-ocher-light/40 hover:text-charcoal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="rounded-2xl bg-carmine/10 border border-carmine/20 p-5 text-center text-sm font-medium text-carmine">
              {error}
            </div>
          ) : (
            <>
              <div
                id={containerId}
                className="overflow-hidden rounded-2xl bg-black/5 border border-ocher/30 [&_video]:!w-full [&_video]:!h-auto [&_video]:!max-h-[320px] [&_video]:!object-cover [&_video]:!rounded-2xl [&_canvas]:!hidden [&_img]:!hidden"
              />
              {scanning && (
                <p className="mt-3 text-center text-xs font-semibold text-golden-rich">
                  ⚡ 请将会员二维码对准镜头中央扫描框
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

