"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import {
  Card,
  PageHeader,
  Badge,
  MemberAvatar,
  EmptyState,
} from "@/components/ui";
import { useMember } from "@/components/MemberContext";
import { PageWrapper } from "@/components/PageWrapper";
import { Leaderboard } from "@/components/Leaderboard";
import { LotusLoading } from "@/components/LotusLoading";
import { QRModal } from "@/components/QRModal";
import { QRScanner } from "@/components/QRScanner";
import { CheckInToast } from "@/components/CheckInToast";
import LiquidOrbButton from "@/components/LiquidOrbButton";
import { Card3D } from "@/components/Card3D";
import { GoldShimmerBorder } from "@/components/GoldShimmerBorder";
import { DailyDharmaCard } from "@/components/DailyDharmaCard";
import { DharmaBadges, DHARMA_LEVELS } from "@/components/DharmaBadges";
import { TimelineView } from "@/components/TimelineView";
import { Dashboard3DMenu } from "@/components/Dashboard3DMenu";
import { motion, AnimatePresence } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import { Camera } from "lucide-react";
import { KaresansuiBackground } from "@/components/KaresansuiBackground";
import { LivingBodhiTree } from "@/components/LivingBodhiTree";
import dynamic from "next/dynamic";
import type { LotusSeaCanvasProps } from "@/components/LotusSeaCanvas";

const LotusSeaCanvas = dynamic<LotusSeaCanvasProps>(() => import("@/components/LotusSeaCanvas"), { ssr: false });

interface AttendanceRecord {
  id: string;
  dateTime: string;
  eventName: string;
  pointsEarned: number;
}

interface MemberDetail {
  attendances: AttendanceRecord[];
  redemptions: {
    id: string;
    pointsSpent: number;
    createdAt: string;
    reward: { name: string };
  }[];
}

interface ToastData {
  memberName: string;
  memberId: string;
  pointsEarned: number;
}

export default function DashboardPage() {
  const { currentMember, members, loading, refreshMembers } = useMember();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "leaderboard" | "badges">("history");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [showBirthdayConfetti, setShowBirthdayConfetti] = useState(false);
  const [showLotusCanvas, setShowLotusCanvas] = useState(false);
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { width, height } = useWindowSize();

  const fetchDetail = () => {
    if (!currentMember) return;
    fetch(`/api/members/${currentMember.id}`)
      .then((res) => res.json())
      .then(setDetail);
  };

  useEffect(() => {
    if (!currentMember) return;
    fetchDetail();

    fetch(`/api/qrcode?memberId=${currentMember.memberId}`)
      .then((res) => res.json())
      .then((data) => setQrCode(data.qrDataUrl));
      
    fetch(`/api/events`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveEventsCount(data.length);
        }
      })
      .catch(() => setLiveEventsCount(0));

    // 生日检查逻辑
    if (currentMember.birthday) {
      const today = new Date();
      const bday = new Date(currentMember.birthday);
      
      if (today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()) {
        const yearKey = `jbs_bday_${currentMember.id}_${today.getFullYear()}`;
        const hasClaimed = localStorage.getItem(yearKey);
        
        if (!hasClaimed) {
          setShowBirthdayConfetti(true);
          
          // 给用户加 2 分
          fetch(`/api/members/${currentMember.id}/birthday-bonus`, { method: "POST" })
            .then(res => res.json())
            .then(() => {
              localStorage.setItem(yearKey, "true");
              refreshMembers(); // Refresh global score
              fetchDetail(); // Refresh history timeline
            })
            .catch(console.error);
        }
      }
    }
  }, [currentMember]);

  // 计算会员当前修持等级称号
  const memberLevelTitle = useMemo(() => {
    if (!currentMember) return "初发心菩萨";
    const pts = currentMember.totalPoints;
    for (let i = DHARMA_LEVELS.length - 1; i >= 0; i--) {
      if (pts >= DHARMA_LEVELS[i].minPoints) {
        return `${DHARMA_LEVELS[i].badge} ${DHARMA_LEVELS[i].title}`;
      }
    }
    return "🌱 初发心菩萨";
  }, [currentMember]);

  const handleAvatarClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    fileInputRef.current?.click();
  };

  // 客户端图像智能无损/高清压缩，兼容任意超大分辨率和手机照片格式 (HEIC/PNG/JPG/WebP)
  const compressImageToDataUrl = (file: File, maxDim = 512, quality = 0.88): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMember) return;

    setUploading(true);
    setUploadMsg("正在处理并上传新头像...");

    try {
      // 1. 客户端秒级压缩优化
      const compressedDataUrl = await compressImageToDataUrl(file, 512, 0.88);

      if (!compressedDataUrl) {
        throw new Error("图片读取失败");
      }

      // 2. 发送至服务器更新
      const res = await fetch(`/api/members/${currentMember.id}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoData: compressedDataUrl,
          ext: "jpg",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshMembers();
        sonnerToast.success("头像更新成功！", {
          description: "全新庄严相貌已保存并实时展现。",
          icon: "🪷",
        });
        setUploadMsg("头像已更新！");
      } else {
        sonnerToast.error(data.error || "上传失败");
        setUploadMsg(data.error || "上传失败");
      }
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      sonnerToast.error(err?.message || "上传失败，请稍后重试");
      setUploadMsg("上传失败，请稍后重试");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 会员主动扫描二维码（活动码或签到码）
  const handleScan = async (decodedText: string) => {
    setShowScanner(false);
    if (!currentMember) return;

    try {
      const eventName = decodedText.startsWith("EVENT:")
        ? decodedText.replace("EVENT:", "")
        : decodedText || "佛学会常规共修活动";

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: currentMember.id,
          eventName: eventName,
          pointsEarned: 5,
        }),
      });

      if (res.ok) {
        await refreshMembers();
        fetchDetail();
        setToast({
          memberName: currentMember.name,
          memberId: currentMember.memberId,
          pointsEarned: 5,
        });
        setToastVisible(true);
      } else {
        alert("签到失败或该活动已完成签到");
      }
    } catch {
      alert("扫码签到遇到网络异常");
    }
  };

  if (loading) {
    return (
      <PageWrapper page="dashboard">
        <LotusLoading text="佛光普照 · 正在读取会员资料与功德..." />
      </PageWrapper>
    );
  }

  if (!currentMember) {
    return (
      <PageWrapper page="dashboard">
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="暂无会员数据"
          description="请先添加会员或运行数据库种子脚本"
        />
      </PageWrapper>
    );
  }

  const attendanceCount = detail?.attendances.length ?? 0;
  const redemptionCount = detail?.redemptions.length ?? 0;

  return (
    <>
      {/* ── 枯山水沙地底层（Canvas 固定全屏，z-index: -1） ── */}
      <KaresansuiBackground />

      <PageWrapper page="dashboard">
      {showBirthdayConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti 
            width={width} 
            height={height} 
            recycle={false} 
            numberOfPieces={400} 
            colors={['#c9a227', '#b8860b', '#e8c872', '#faf7f2']} 
            gravity={0.15}
            onConfettiComplete={() => setShowBirthdayConfetti(false)}
          />
        </div>
      )}

      {/* 生日祝福弹窗 */}
      <AnimatePresence>
        {showBirthdayConfetti && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-2xl text-center max-w-sm w-full border border-golden-deep/30 dark:bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-golden-deep/10 to-transparent pointer-events-none" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-golden-deep/10 text-4xl">
                🎂
              </div>
              <h3 className="text-xl font-bold text-golden-rich mb-2">祝您福寿安康！</h3>
              <p className="text-sm text-charcoal/80 dark:text-slate-300 mb-6">
                佛学会为您送上 <span className="font-bold text-jade">2</span> 个生辰福气积分。愿您福慧双增，法喜充满。
              </p>
              <button 
                onClick={() => setShowBirthdayConfetti(false)}
                className="w-full rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich py-3 font-bold text-white shadow-md transition-transform active:scale-95"
              >
                感恩接受
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="会员仪表板"
        subtitle="查看个人资料、修持境界、积分汇总与出勤记录"
      />

      {/* 会员信息卡 (3D 景深 + 鎏金流光边框) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8"
      >
        <Card3D intensity={8} glow={true}>
          <GoldShimmerBorder glowOpacity={0.85}>
            <div className="relative p-6 sm:p-8 overflow-hidden rounded-[22px]">
              <div className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.05]">
                <Image src="/logo.png" alt="" fill className="object-contain" />
              </div>

              <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {/* 头像 + 更换照片按钮 */}
                <div className="flex flex-col items-center sm:items-start shrink-0">
                  <div
                    className="relative group cursor-pointer select-none rounded-full"
                    onClick={handleAvatarClick}
                    title="点击更换头像相片"
                  >
                    <MemberAvatar
                      name={currentMember.name}
                      photo={currentMember.photo}
                      size="lg"
                    />

                    {/* 相机微光悬浮层 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-xs">
                      {uploading ? (
                        <svg className="h-7 w-7 animate-spin text-amber-300" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-white drop-shadow" />
                          <span className="mt-1 text-[10px] font-bold text-white tracking-wider">更换相片</span>
                        </>
                      )}
                    </div>

                    {/* 始终可见的小相机角标 (右下角发光徽章) */}
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-golden-deep text-white shadow-md border-2 border-white transition-transform group-hover:scale-110">
                      <Camera className="h-3.5 w-3.5" />
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="text-2xl font-bold text-charcoal dark:text-white">
                      {currentMember.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-200 to-amber-400 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-sm border border-amber-300">
                        {memberLevelTitle}
                      </span>
                      {currentMember.role === "理事" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-black text-amber-900 dark:text-amber-200 shadow-sm">
                          <span>🪷</span> 理事
                        </span>
                      )}
                      {currentMember.role === "学长姐" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 text-xs font-black text-indigo-900 dark:text-indigo-200 shadow-sm">
                          <span>🏮</span> 学长姐
                        </span>
                      )}
                      {(!currentMember.role || currentMember.role === "学员") && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-900 dark:text-emerald-200 shadow-sm">
                          <span>🌱</span> 学员
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted dark:text-slate-400">{currentMember.email}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge variant="golden">{currentMember.memberId}</Badge>
                    <Badge variant={currentMember.role === "理事" ? "carmine" : currentMember.role === "学长姐" ? "golden" : "jade"}>
                      {currentMember.role === "理事" ? "🪷 护持理事" : currentMember.role === "学长姐" ? "🏮 资深学长姐" : "🌱 佛学社员"}
                    </Badge>
                    <Badge variant="jade">活跃会员</Badge>
                  </div>
                  <AnimatePresence>
                    {uploadMsg && (
                      <motion.p
                        key="upload-msg"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 text-xs text-jade font-medium"
                      >
                        {uploadMsg}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="mt-1 text-[10px] text-muted/60 dark:text-slate-400/60">点击头像更换照片</p>
                </div>

                {/* ── 功德菩提树（积分可视化） ── */}
                <div className="flex flex-col items-center">
                  <p className="mb-1 text-xs font-medium text-muted dark:text-slate-400">累积积分</p>
                  <LivingBodhiTree
                    points={currentMember.totalPoints}
                    size="sm"
                  />
                </div>

                {/* 会员二维码（点击放大与下载） */}
                {qrCode && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative cursor-pointer"
                      onClick={() => setIsQrModalOpen(true)}
                      title="点击放大与下载 PDF"
                    >
                      <img
                        src={qrCode}
                        alt="会员二维码"
                        className="h-28 w-28 rounded-2xl ring-2 ring-ocher/30 shadow-md transition-shadow group-hover:shadow-lg group-hover:ring-golden-deep bg-white p-1"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-charcoal/50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 text-white">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                        <span className="text-[10px] font-bold mt-1">放大/下载</span>
                      </div>
                    </motion.div>
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="mt-2 text-[11px] font-semibold text-golden-rich hover:underline"
                    >
                      🔍 放大 / 存为PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GoldShimmerBorder>
        </Card3D>
      </motion.div>

      {/* 3D 交互仪表盘菜单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      >
        <Dashboard3DMenu
          points={currentMember.totalPoints}
          attendanceCount={attendanceCount}
          liveEventsCount={liveEventsCount}
          registeredMembersCount={members.length}
          onOpenScan={() => setShowScanner(true)}
        />
      </motion.div>

      {/* 每日菩提法语 3D 抽签 */}
      <motion.div
        id="dharma-section"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
      >
        <DailyDharmaCard />
      </motion.div>

      {/* 视图切换 Tabs (3 栏切换) */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-2xl bg-white/70 dark:bg-slate-800/80 p-1.5 shadow-sm border border-ocher/20 dark:border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            个人出勤与兑换
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "leaderboard"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            <span>🏆</span>
            精进积分榜
          </button>

          <button
            onClick={() => setActiveTab("badges")}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "badges"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            <span>🎖️</span>
            修持勋章馆
          </button>
        </div>
      </div>

      {/* 切换展示区域 */}
      <AnimatePresence mode="wait">
        {activeTab === "history" && (
          <motion.div
            key="history-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card>
              <h4 className="mb-6 text-lg font-semibold text-charcoal dark:text-white">出勤与兑换时间轴</h4>
              <TimelineView 
                attendances={detail?.attendances || []} 
                redemptions={detail?.redemptions || []} 
              />
            </Card>
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <Leaderboard members={members} currentMemberId={currentMember?.id} />
            </Card>
          </motion.div>
        )}

        {activeTab === "badges" && (
          <motion.div
            key="badges-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <DharmaBadges
              member={currentMember}
              attendanceCount={attendanceCount}
              redemptionCount={redemptionCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 二维码高清放大 & PDF 下载弹窗 */}
      <QRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        qrCodeUrl={qrCode}
        memberName={currentMember?.name || ""}
        memberId={currentMember?.memberId || ""}
        totalPoints={currentMember?.totalPoints || 0}
      />

      {/* 扫一扫相机弹窗 */}
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* 签到成功 Spring 气泡 */}
      {toast && (
        <CheckInToast
          memberName={toast.memberName}
          memberId={toast.memberId}
          pointsEarned={toast.pointsEarned}
          visible={toastVisible}
          onDismiss={() => {
            setToastVisible(false);
            setTimeout(() => setToast(null), 400);
          }}
        />
      )}
      
      {/* 供灯祈福入口按钮 */}
      <LiquidOrbButton onClick={() => setShowLotusCanvas(true)} />

      {/* 供灯祈福全屏 3D 模态框 */}
      <AnimatePresence>
        {showLotusCanvas && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="relative w-[95vw] max-w-5xl h-[85vh] overflow-hidden rounded-3xl border border-golden-deep/40 shadow-[0_0_50px_rgba(201,162,39,0.15)] bg-[#050505]">
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowLotusCanvas(false)}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-carmine/80"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 环境提示文本 */}
              <div className="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs tracking-widest text-golden-rich backdrop-blur-md">
                双击水面缩放视角 · 点击心灯功德+1 · 每位同修限供一灯
              </div>
              
              <LotusSeaCanvas 
                currentUserId={currentMember?.id || "user-me"}
                currentUserName={currentMember?.name ?? "同修"}
                currentUserRole={(currentMember?.role as any) || "学员"}
                maxLampsPerUser={1}
                onPlaceLamp={() => sonnerToast.success("已供上一盏心灯", { icon: "🪷" })}
                onDedicate={() => sonnerToast.success("功德已回向", { icon: "✨" })}
                onLimitReached={() => sonnerToast.warning("每位同修仅限供奉一盏莲灯", { duration: 4000 })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
    </>
  );
}
