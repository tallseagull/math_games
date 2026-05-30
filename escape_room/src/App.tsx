import { FinaleScreen } from './components/FinaleScreen';
import { GameLayout } from './components/GameLayout';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useGameState } from './hooks/useGameState';
import './App.css';
import './styles/animations.css';
import './styles/global.css';

function App() {
  const {
    phase,
    currentStep,
    currentTask,
    feedback,
    showHint,
    showFireworks,
    fireworksVariant,
    startGame,
    submitAnswer,
    goToNextQuestion,
    clearWrongFeedback,
    isLastStep,
    totalSteps,
  } = useGameState();

  if (phase === 'welcome') {
    return (
      <div className="app">
        <WelcomeScreen onStart={startGame} />
      </div>
    );
  }

  if (phase === 'finale') {
    return (
      <div className="app">
        <FinaleScreen />
      </div>
    );
  }

  if (!currentTask) {
    return null;
  }

  return (
    <div className="app app--playing">
      <header className="app-header">
        <h1 className="app-header__title">חדר בריחה — עזרו לדני!</h1>
      </header>
      <GameLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        currentTask={currentTask}
        feedback={feedback}
        showHint={showHint}
        showFireworks={showFireworks}
        fireworksVariant={fireworksVariant}
        isLastStep={isLastStep}
        onSubmit={submitAnswer}
        onNext={goToNextQuestion}
        onInputChange={clearWrongFeedback}
      />
    </div>
  );
}

export default App;
