import boardBg from '../assets/board-background.png';
import { boardAspectRatio, boardConfig, getStepPosition } from '../data/stepPositions';
import { Character } from './Character';
import './GameBoard.css';

interface GameBoardProps {
  currentStep: number;
  isFinaleNearby: boolean;
}

export function GameBoard({ currentStep, isFinaleNearby }: GameBoardProps) {
  const position = getStepPosition(currentStep);

  return (
    <div
      className={`game-board ${isFinaleNearby ? 'game-board--finale board--finale-glow' : ''}`}
      style={
        {
          '--board-aspect': boardAspectRatio,
          '--board-w': boardConfig.width,
          '--board-h': boardConfig.height,
        } as React.CSSProperties
      }
    >
      <div className="game-board__surface">
        <img
          src={boardBg}
          alt="לוח המשחק — מסלול מבית הספר לחופש"
          className="game-board__image"
        />
        <Character position={position} />
      </div>
    </div>
  );
}
