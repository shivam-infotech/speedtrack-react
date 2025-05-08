/**
 * This store actually uses the zustand library to manage the state of the animation.
 */

import { create } from "zustand";
import { mutative } from 'zustand-mutative';


export const useAnimatedPositions = create(mutative((set, get) => ({
    animPositions: {},
    animHistory: {},
    lastAnimatedPositions: {},
    setPositions: (positions) => set({ animPositions: positions }),
    setHistory: (history) => set({ animHistory: history }),
    setLastAnimatedPositions: (positions) => set({ lastAnimatedPositions: positions }),
    resetHistory: () => set({ animHistory: {} }),
  })));
  