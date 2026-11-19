import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

import { useAppStore } from '@/store/app-store';

/**
 * Short original sound effects (synthesised, in assets/sounds) and an optional calm wave loop.
 * Everything fails soft: no sound is ever needed to use the app. Sounds respect the phone's silent
 * switch and mix with whatever else is playing, so they never stop the member's own music.
 */

const NOTES = [
  require('../../assets/sounds/note-1.wav'),
  require('../../assets/sounds/note-2.wav'),
  require('../../assets/sounds/note-3.wav'),
  require('../../assets/sounds/note-4.wav'),
  require('../../assets/sounds/note-5.wav'),
  require('../../assets/sounds/note-6.wav'),
  require('../../assets/sounds/note-7.wav'),
  require('../../assets/sounds/note-8.wav'),
  require('../../assets/sounds/note-9.wav'),
];
const EFFECTS = {
  chime: require('../../assets/sounds/chime.wav'),
  miss: require('../../assets/sounds/miss.wav'),
  land: require('../../assets/sounds/land.wav'),
};
const WAVES = require('../../assets/sounds/waves.wav');

export type Effect = keyof typeof EFFECTS;

let modeSet = false;
function setMode() {
  if (modeSet) return;
  modeSet = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
}

// Players are made on first use and kept: a dozen tiny clips, replayed often.
const players = new Map<string | number, AudioPlayer>();

function play(key: string | number, source: number) {
  if (useAppStore.getState().soundsOff) return;
  try {
    setMode();
    let player = players.get(key);
    if (!player) {
      player = createAudioPlayer(source);
      players.set(key, player);
    }
    player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // No audio on this device or browser: carry on silently.
  }
}

/** The note for Pattern Pop bubble `index` (0..8): each bubble has its own pitch. */
export function playNote(index: number) {
  if (index >= 0 && index < NOTES.length) play(`note-${index}`, NOTES[index]);
}

export function playEffect(effect: Effect) {
  play(effect, EFFECTS[effect]);
}

/**
 * The calm wave loop, while `active` and only if the member turned waves on in Settings.
 * One loop lasts one breath of the Breathe exercise (4 s in, 4 s hold, 6 s out), so starting it
 * with the first breath keeps it in step.
 */
export function useWaves(active: boolean) {
  const wavesOn = useAppStore((s) => !!s.wavesOn);
  useEffect(() => {
    if (!active || !wavesOn) return;
    let player: AudioPlayer | undefined;
    try {
      setMode();
      player = players.get('waves') ?? createAudioPlayer(WAVES);
      players.set('waves', player);
      player.loop = true;
      player.volume = 0.6;
      player.seekTo(0).catch(() => undefined);
      player.play();
    } catch {
      // No audio: the exercise works the same without it.
    }
    return () => {
      try {
        player?.pause();
      } catch {
        // Already gone.
      }
    };
  }, [active, wavesOn]);
}
