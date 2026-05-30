import boardBg from '../assets/board-background.png';
import kidImg from '../assets/kid.png';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div
        className="welcome-screen__bg"
        style={{ backgroundImage: `url(${boardBg})` }}
        aria-hidden
      />
      <div className="welcome-screen__content">
        <h1 className="welcome-screen__title">חדר בריחה</h1>
        <p className="welcome-screen__subtitle">ברוכים הבאים לחדר הבריחה של כיתה ג׳!</p>
        <img src={kidImg} alt="דני" className="welcome-screen__kid character--idle" />
        <p className="welcome-screen__text">
          תעזרו לדני לסיים בהצלחה את כיתה ג׳.
          <br />
          רק אם תצליחו לפתור את כל המשימות, הוא יוכל לצאת לחופש הגדול.
        </p>
        <button type="button" className="welcome-screen__btn" onClick={onStart}>
          התחילו את המשימה!
        </button>
      </div>
    </div>
  );
}
