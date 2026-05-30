export type GamePhase = 'welcome' | 'playing' | 'finale';

export type FeedbackState = 'idle' | 'correct' | 'wrong';

export interface Task {
  id: number;
  title: string;
  questionLines: string[];
  /** Per-line text direction; defaults to rtl when omitted */
  questionLineDirs?: ('rtl' | 'ltr')[];
  image?: string;
  imageSecondary?: string;
  acceptedAnswers: string[];
  acceptAny?: boolean;
  hint?: string;
  inputPlaceholder?: string;
  inputDir?: 'rtl' | 'ltr';
}

export interface StepPosition {
  left: number;
  top: number;
}
