import type { FeedbackState } from '../types';
import './FeedbackBanner.css';

interface FeedbackBannerProps {
  feedback: FeedbackState;
  submittedAnswer?: string;
}

export function FeedbackBanner({ feedback, submittedAnswer }: FeedbackBannerProps) {
  if (feedback === 'idle') {
    return null;
  }

  return (
    <div
      className={`feedback-banner feedback-banner--${feedback}`}
      role="status"
      aria-live="polite"
    >
      {feedback === 'correct' ? (
        <>
          <p className="feedback-banner__message">🎆 מצוין! לחצו על &quot;שאלה הבאה&quot;</p>
          {submittedAnswer?.trim() && (
            <p className="feedback-banner__answer">
              התשובה שלכם: <strong>{submittedAnswer.trim()}</strong>
            </p>
          )}
        </>
      ) : (
        '✗ לא בדיוק — נסו שוב'
      )}
    </div>
  );
}
