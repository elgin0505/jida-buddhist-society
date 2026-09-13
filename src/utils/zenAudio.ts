// src/utils/zenAudio.ts
'use client';

// All audio functions have been completely neutered as per user request (absolutely no sound effects).

export function playSingingBowl(freq = 432, volume = 0.35) {
  // Sound disabled
}

export function startAmbientSoundscape() {
  // Sound disabled
}

export function stopAmbientSoundscape() {
  // Sound disabled
}

export function toggleAmbientSoundscape(): boolean {
  return false;
}

export function isAmbientPlaying(): boolean {
  return false;
}

export function subscribeAmbientState(cb: (playing: boolean) => void): () => void {
  cb(false);
  return () => {};
}
