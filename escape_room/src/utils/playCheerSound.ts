import applauseSmall from '../assets/audio/applause-small.mp3';
import applause from '../assets/audio/applause.mp3';
import crowdCheer from '../assets/audio/crowd-cheer.mp3';
import yay from '../assets/audio/yay.mp3';

const CHEER_SOUNDS = [applauseSmall, applause, crowdCheer, yay] as const;

export function playCheerSound(): void {
  const src = CHEER_SOUNDS[Math.floor(Math.random() * CHEER_SOUNDS.length)];
  const audio = new Audio(src);
  audio.volume = 0.9;
  void audio.play().catch(() => {
    // Browser may block autoplay before any user interaction.
  });
}
