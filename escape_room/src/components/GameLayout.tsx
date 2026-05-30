import type { FireworksVariant } from './Fireworks';
import { Fireworks } from './Fireworks';
import { GameBoard } from './GameBoard';
import { TaskPanel } from './TaskPanel';
import type { FeedbackState, Task } from '../types';
import './GameLayout.css';

interface GameLayoutProps {
  currentStep: number;
  totalSteps: number;
  currentTask: Task;
  feedback: FeedbackState;
  showHint: boolean;
  showFireworks: boolean;
  fireworksVariant: FireworksVariant;
  isLastStep: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  onInputChange: () => void;
}

export function GameLayout({
  currentStep,
  totalSteps,
  currentTask,
  feedback,
  showHint,
  showFireworks,
  fireworksVariant,
  isLastStep,
  onSubmit,
  onNext,
  onInputChange,
}: GameLayoutProps) {
  const isFinaleNearby = currentStep >= totalSteps - 1;
  const progressPercent = ((currentStep - 1) / totalSteps) * 100;

  return (
    <div className="game-layout">
      <Fireworks variant={fireworksVariant} active={showFireworks} />
      <section className="game-layout__panel" aria-label="משימה נוכחית">
        <TaskPanel
          key={currentStep}
          task={currentTask}
          currentStep={currentStep}
          totalSteps={totalSteps}
          feedback={feedback}
          showHint={showHint}
          progressPercent={progressPercent}
          isLastStep={isLastStep}
          onSubmit={onSubmit}
          onNext={onNext}
          onInputChange={onInputChange}
        />
      </section>
      <section className="game-layout__board" aria-label="לוח התקדמות">
        <GameBoard currentStep={currentStep} isFinaleNearby={isFinaleNearby} />
      </section>
    </div>
  );
}
