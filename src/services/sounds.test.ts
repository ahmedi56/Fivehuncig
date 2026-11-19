import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useAppStore } from '@/store/app-store';

import { playEffect, playNote } from './sounds';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockPlay = jest.fn();
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({ play: mockPlay, pause: jest.fn(), seekTo: jest.fn(async () => undefined) })),
  setAudioModeAsync: jest.fn(async () => undefined),
}));

beforeEach(() => {
  mockPlay.mockClear();
  useAppStore.getState().setSoundsOff(false);
});

describe('sounds', () => {
  it('plays a note per bubble, reusing one player per sound', () => {
    playNote(2);
    playNote(2);
    playNote(5);
    expect(mockPlay).toHaveBeenCalledTimes(3);
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
  });

  it('never plays in silent mode and lets other audio keep playing', () => {
    playEffect('chime');
    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  });

  it('stays quiet when game sounds are off, and ignores bubbles that do not exist', () => {
    useAppStore.getState().setSoundsOff(true);
    playNote(1);
    playEffect('land');
    useAppStore.getState().setSoundsOff(false);
    playNote(9);
    playNote(-1);
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('fails soft when the device has no audio', () => {
    jest.mocked(createAudioPlayer).mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    expect(() => playEffect('miss')).not.toThrow();
  });
});
