import positionsConfig from './stepPositions.json';
import type { StepPosition } from '../types';

export interface BoardConfig {
  width: number;
  height: number;
}

export interface StepPositionEntry {
  step: number;
  left: number;
  top: number;
}

export const boardConfig: BoardConfig = positionsConfig.board;

/** CSS aspect-ratio value matching the board image pixels */
export const boardAspectRatio = `${boardConfig.width} / ${boardConfig.height}`;

export const STEP_POSITIONS: StepPosition[] = positionsConfig.positions.map(
  (entry) => ({
    left: entry.left,
    top: entry.top,
  }),
);

export function getStepPosition(step: number): StepPosition {
  const entry = positionsConfig.positions.find((p) => p.step === step);
  if (entry) {
    return { left: entry.left, top: entry.top };
  }
  return STEP_POSITIONS[step - 1] ?? STEP_POSITIONS[0];
}
