import kidImg from '../assets/kid.png';
import { Fireworks } from './Fireworks';
import './FinaleScreen.css';

const FIREWORK_VARIANTS = [0, 1, 2, 3] as const;
const CONFETTI_COLORS = [
  '#f6ad55',
  '#68d391',
  '#63b3ed',
  '#f687b3',
  '#faf089',
  '#fc8181',
  '#ecc94b',
];

export function FinaleScreen() {
  return (
    <div className="finale-screen">
      {FIREWORK_VARIANTS.map((variant) => (
        <Fireworks key={variant} variant={variant} active fullScreen />
      ))}

      <div className="finale-screen__confetti" aria-hidden>
        {Array.from({ length: 90 }, (_, i) => (
          <span
            key={i}
            className="finale-screen__confetti-piece"
            style={{
              left: `${(i * 11) % 100}%`,
              animationDelay: `${(i % 15) * 0.12}s`,
              animationDuration: `${3.2 + (i % 5) * 0.4}s`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              width: `${8 + (i % 4) * 3}px`,
              height: `${10 + (i % 3) * 4}px`,
            }}
          />
        ))}
      </div>

      <div className="finale-screen__hero">
        <img
          src={kidImg}
          alt="דני"
          className="finale-screen__kid character--idle"
        />
      </div>

      <div className="finale-screen__content">
        <h1 className="finale-screen__title">סיום</h1>
        <p className="finale-screen__line">כל הכבוד כיתה ג׳!</p>
        <p className="finale-screen__line finale-screen__line--big">
          הצלחתם לפתוח את המנעול ולהציל את החופש הגדול! 🎉
        </p>
        <p className="finale-screen__line">אתם מוכנים לכיתה ד׳!</p>
        <p className="finale-screen__line finale-screen__line--accent">כל הכבוד!</p>
      </div>
    </div>
  );
}
