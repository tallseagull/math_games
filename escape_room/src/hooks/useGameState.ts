import { useCallback, useMemo, useState } from 'react';
import type { FireworksVariant } from '../components/Fireworks';
import { getTaskByStep, TASKS } from '../data/tasks';
import type { FeedbackState, GamePhase } from '../types';
import { isAnswerCorrect } from '../utils/answerValidation';
import { playCheerSound } from '../utils/playCheerSound';

export function useGameState() {
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
  const [attemptsByStep, setAttemptsByStep] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [celebrationStep, setCelebrationStep] = useState<number | null>(null);

  const currentTask = useMemo(
    () => getTaskByStep(currentStep),
    [currentStep],
  );

  const fireworksVariant = useMemo((): FireworksVariant => {
    const step = celebrationStep ?? currentStep;
    return ((step - 1) % 4) as FireworksVariant;
  }, [celebrationStep, currentStep]);

  const showFireworks = feedback === 'correct';

  const startGame = useCallback(() => {
    setPhase('playing');
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setAttemptsByStep({});
    setFeedback('idle');
    setCelebrationStep(null);
  }, []);

  const submitAnswer = useCallback(
    (answer: string) => {
      const task = getTaskByStep(currentStep);
      if (!task || feedback === 'correct') {
        return;
      }

      setAttemptsByStep((prev) => ({
        ...prev,
        [currentStep]: (prev[currentStep] ?? 0) + 1,
      }));

      const correct = isAnswerCorrect(
        answer,
        task.acceptedAnswers,
        task.acceptAny,
      );

      if (correct) {
        playCheerSound();
        setCelebrationStep(currentStep);
        setFeedback('correct');
        setCompletedSteps((prev) => new Set(prev).add(currentStep));
      } else {
        setFeedback('wrong');
      }
    },
    [currentStep, feedback],
  );

  const goToNextQuestion = useCallback(() => {
    if (feedback !== 'correct') {
      return;
    }

    if (currentStep >= TASKS.length) {
      setPhase('finale');
    } else {
      setCurrentStep((s) => s + 1);
    }

    setFeedback('idle');
    setCelebrationStep(null);
  }, [currentStep, feedback]);

  const clearWrongFeedback = useCallback(() => {
    if (feedback === 'wrong') {
      setFeedback('idle');
    }
  }, [feedback]);

  const attempts = attemptsByStep[currentStep] ?? 0;
  const showHint = attempts >= 2 && feedback !== 'correct';
  const isLastStep = currentStep >= TASKS.length;

  return {
    phase,
    currentStep,
    currentTask,
    completedSteps,
    feedback,
    attempts,
    showHint,
    showFireworks,
    fireworksVariant,
    isLastStep,
    startGame,
    submitAnswer,
    goToNextQuestion,
    clearWrongFeedback,
    totalSteps: TASKS.length,
  };
}
