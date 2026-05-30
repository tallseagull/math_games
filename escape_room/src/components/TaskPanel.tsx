import { useEffect, useState } from 'react';
import lockImg from '../assets/decorations/lock.png';
import type { FeedbackState, Task } from '../types';
import { FeedbackBanner } from './FeedbackBanner';
import './TaskPanel.css';

interface TaskPanelProps {
  task: Task;
  currentStep: number;
  totalSteps: number;
  feedback: FeedbackState;
  showHint: boolean;
  isLastStep: boolean;
  progressPercent: number;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  onInputChange: () => void;
}

export function TaskPanel({
  task,
  currentStep,
  totalSteps,
  feedback,
  showHint,
  isLastStep,
  progressPercent,
  onSubmit,
  onNext,
  onInputChange,
}: TaskPanelProps) {
  const [answer, setAnswer] = useState('');
  const [lockShaking, setLockShaking] = useState(false);
  const isCorrect = feedback === 'correct';
  const hasImage = Boolean(task.image);
  const manyLines = task.questionLines.length >= 4;

  useEffect(() => {
    if (feedback === 'wrong') {
      setLockShaking(true);
      const t = window.setTimeout(() => setLockShaking(false), 500);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [feedback]);

  useEffect(() => {
    if (!isCorrect) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCorrect, onNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isCorrect) {
      return;
    }
    onSubmit(answer);
  };

  const handleChange = (value: string) => {
    setAnswer(value);
    onInputChange();
  };

  const questionCardClass = [
    'task-panel__question-card',
    manyLines ? 'task-panel__question-card--many-lines' : '',
    task.imageSecondary ? 'task-panel__question-card--dual-image' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const panelClass = [
    'task-panel',
    'task-panel--split',
    hasImage ? '' : 'task-panel--no-image',
    isCorrect ? 'task-panel--correct' : '',
    feedback === 'wrong' ? 'task-panel--wrong' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={panelClass}>
      <div className="task-panel__progress-wrap">
        <div className="task-panel__progress-labels">
          <span>התקדמות</span>
          <span>
            {currentStep} / {totalSteps}
          </span>
        </div>
        <div className="task-panel__progress-track">
          <div
            className="task-panel__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <header className="task-panel__header">
        <img
          src={lockImg}
          alt=""
          className={`task-panel__lock ${lockShaking ? 'lock--shake' : ''}`}
          aria-hidden
        />
        <h2 className="task-panel__title">{task.title}</h2>
      </header>

      <div className="task-panel__body">
        <FeedbackBanner
          feedback={feedback}
          submittedAnswer={isCorrect ? answer : undefined}
        />

        <div className={questionCardClass}>
          <div className="task-panel__question">
            {task.questionLines.map((line, i) => {
              const lineDir = task.questionLineDirs?.[i] ?? 'rtl';
              return (
                <p
                  key={i}
                  className={`task-panel__line${lineDir === 'ltr' ? ' task-panel__line--ltr' : ''}`}
                  dir={lineDir}
                >
                  {line}
                </p>
              );
            })}
          </div>

          {hasImage && (
            <div className="task-panel__images">
              <img src={task.image} alt="" className="task-panel__img" />
              {task.imageSecondary && (
                <img src={task.imageSecondary} alt="" className="task-panel__img" />
              )}
            </div>
          )}
        </div>

        {showHint && task.hint && (
          <p className="task-panel__hint">
            <span className="task-panel__hint-icon">💡</span>
            <span>{task.hint}</span>
          </p>
        )}
      </div>

      <div className="task-panel__footer">
        {isCorrect ? (
          <button
            type="button"
            className="task-panel__next"
            onClick={onNext}
            autoFocus
          >
            {isLastStep ? 'לסיום! 🎉' : 'שאלה הבאה ←'}
          </button>
        ) : (
          <form className="task-panel__form" onSubmit={handleSubmit}>
            <label htmlFor="task-answer" className="task-panel__label">
              התשובה שלכם
            </label>
            <input
              id="task-answer"
              type="text"
              className="task-panel__input"
              value={answer}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={
                task.inputPlaceholder !== undefined
                  ? task.inputPlaceholder
                  : 'כתבו את התשובה כאן...'
              }
              dir={task.inputDir ?? 'rtl'}
              autoComplete="off"
            />
            <button
              type="submit"
              className="task-panel__submit"
              disabled={!answer.trim()}
            >
              בדוק תשובה ✓
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
