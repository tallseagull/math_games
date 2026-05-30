import kidImg from '../assets/kid.png';
import type { StepPosition } from '../types';
import './Character.css';

interface CharacterProps {
  position: StepPosition;
}

export function Character({ position }: CharacterProps) {
  return (
    <div
      className="character-anchor"
      style={{
        left: `${position.left}%`,
        top: `${position.top}%`,
      }}
    >
      <img
        src={kidImg}
        alt="דני"
        className="character character--idle character--hover"
      />
    </div>
  );
}
