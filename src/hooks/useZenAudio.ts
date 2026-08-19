"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * 殿堂级空灵音效交互 (Spatial Auditory Feedback)
 * 用于在关键操作时触发无阻塞的颂钵 (Singing Bowl) 音效。
 */
export function useZenAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 仅在客户端预加载音频
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/singing-bowl.mp3");
      audio.preload = "auto";
      audio.volume = 0.65; // 保持音量轻柔适中
      audioRef.current = audio;
    }
  }, []);

  const playZenSound = useCallback(() => {
    if (!audioRef.current) return;

    // 重置时间以支持快速连续触发（尽管通常不建议高频触发禅音）
    audioRef.current.currentTime = 0;

    // 异步触发播放，绝不阻塞主线程和页面跳转
    audioRef.current.play().catch((err) => {
      // 浏览器策略可能会拦截未发生交互前的音频播放
      console.warn("Zen audio play blocked by browser policy or missing file:", err);
    });
  }, []);

  return { playZenSound };
}
