import { useCallback } from "react";
import { playSingingBowl } from "@/utils/zenAudio";

/**
 * 殿堂级空灵音效交互 (Spatial Auditory Feedback)
 * 采用轻量级 Web Audio API 程序化合成铜磬/颂钵 (Singing Bowl) 音效，
 * 彻底消除外部 MP3 依赖与 404 错误。
 */
export function useZenAudio() {
  const playZenSound = useCallback((freq = 432, volume = 0.35) => {
    playSingingBowl(freq, volume);
  }, []);

  return {
    playZenSound,
    playZenAudio: playZenSound,
  };
}

