import { useEffect, useId, useRef, useState } from 'react';
import './play.css';

type MiniGameProps = {
  onComplete: (score: number) => void;
  onClose: () => void;
};
type Direction = 'up' | 'left' | 'right' | 'down';
type Stage = 'ready' | 'showing' | 'playing' | 'result';

const pads: { direction: Direction; arrow: string; key: string; berry: string }[] = [
  { direction: 'up', arrow: '↑', key: 'W', berry: 'Blueberry' },
  { direction: 'left', arrow: '←', key: 'A', berry: 'Strawberry' },
  { direction: 'right', arrow: '→', key: 'D', berry: 'Golden berry' },
  { direction: 'down', arrow: '↓', key: 'S', berry: 'Blackberry' },
];
const sequences: Direction[][] = [
  ['up', 'left', 'down'],
  ['right', 'up', 'down', 'left'],
  ['left', 'down', 'right', 'up', 'left'],
];
const keyboard: Record<string, Direction> = {
  ArrowUp: 'up', w: 'up', ArrowLeft: 'left', a: 'left',
  ArrowRight: 'right', d: 'right', ArrowDown: 'down', s: 'down',
};

export default function MiniGame({ onComplete, onClose }: MiniGameProps) {
  const titleId = useId();
  const instructionsId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstPadRef = useRef<HTMLButtonElement>(null);
  const collectRef = useRef<HTMLButtonElement>(null);
  const completedRef = useRef(false);
  const quitRef = useRef(false);
  const inputLockRef = useRef(false);
  const [stage, setStage] = useState<Stage>('ready');
  const [round, setRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [hits, setHits] = useState(0);
  const [active, setActive] = useState<Direction | null>(null);
  const [roundFinished, setRoundFinished] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [feedback, setFeedback] = useState('A little listening. A little berry magic.');
  const [cue, setCue] = useState('');
  const score = Math.round((hits / 12) * 10);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (stage === 'playing' && !roundFinished) firstPadRef.current?.focus();
    if (stage === 'result') collectRef.current?.focus();
  }, [stage, roundFinished]);

  useEffect(() => {
    if (stage !== 'showing') return;
    dialogRef.current?.focus();
    const timers: ReturnType<typeof setTimeout>[] = [];
    sequences[round].forEach((direction, index) => {
      timers.push(setTimeout(() => {
        setActive(direction);
        setCue(`${index + 1}: ${pads.find((pad) => pad.direction === direction)!.berry}, ${direction}.`);
      }, 700 + index * 1100));
      timers.push(setTimeout(() => setActive(null), 1450 + index * 1100));
    });
    timers.push(setTimeout(() => {
      setActive(null);
      setCue('');
      setFeedback('Your turn! Repeat the berries in order.');
      inputLockRef.current = false;
      setStage('playing');
    }, 700 + sequences[round].length * 1100));
    return () => timers.forEach(clearTimeout);
  }, [stage, round]);

  function close() {
    if (quitRef.current) return;
    quitRef.current = true;
    onClose();
  }

  function demonstrate(nextRound: number) {
    inputLockRef.current = true;
    setRound(nextRound);
    setPosition(0);
    setRoundFinished(false);
    setFeedback('Watch the glow and remember the order.');
    setStage('showing');
  }

  function choose(direction: Direction) {
    if (stage !== 'playing' || roundFinished || inputLockRef.current || quitRef.current) return;
    inputLockRef.current = true;
    const correct = sequences[round][position] === direction;
    if (correct) setHits((value) => value + 1);
    const nextPosition = position + 1;
    setPosition(nextPosition);
    setFeedback(correct ? `Nice! Berry ${nextPosition} matched.` : `Not quite. Berry ${nextPosition} was ${sequences[round][position]}. Keep going!`);
    if (nextPosition === sequences[round].length) {
      setRoundFinished(true);
    }
  }

  // Keep rapid key/click events from reading the previous input position.
  useEffect(() => {
    if (stage === 'playing' && !roundFinished) inputLockRef.current = false;
  }, [position, stage, roundFinished]);

  function collect() {
    if (completedRef.current || quitRef.current) return;
    completedRef.current = true;
    setClaimed(true);
    onComplete(score);
  }

  return (
    <div className="game-backdrop">
      <div
        className="game-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={instructionsId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          }
          if (event.key === 'Tab') {
            const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex="0"]') ?? []);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
              event.preventDefault();
              first?.focus();
            }
            return;
          }
          const direction = keyboard[event.key.length === 1 ? event.key.toLowerCase() : event.key];
          if (direction && !event.altKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) choose(direction);
          }
        }}
      >
        <header className="game-header">
          <span className="game-eyebrow">A POCKET-SIZED PLAY BREAK</span>
          <button ref={closeRef} type="button" className="game-close" aria-label="Close game without a reward" onClick={close}>×</button>
        </header>
        <div className="game-title-icon" aria-hidden="true">✦</div>
        <h2 id={titleId} className="game-title">Berry rhythm</h2>
        <p id={instructionsId} className="game-instructions">
          Watch the berries glow, then repeat their order. Use arrow keys, WASD, or tap the pads.
        </p>
        <div className="game-rounds" aria-label={`Round ${round + 1} of 3`}>
          {[0, 1, 2].map((value) => <span key={value} className={`game-round${value === round ? ' game-round-current' : ''}${value < round ? ' game-round-done' : ''}`} aria-hidden="true">{value + 1}</span>)}
          <span>Round {round + 1} / 3</span>
        </div>
        {stage !== 'result' ? (
          <>
            <div className={`game-status game-status-${stage}`} role="status" aria-live="polite" aria-atomic="true">
              <strong>{stage === 'ready' ? 'Ready when you are' : stage === 'showing' ? 'Watch & remember' : roundFinished ? 'Round complete!' : 'Your turn'}</strong>
              <span>{feedback}</span>
            </div>
            <div className="game-pads" role="group" aria-label="Berry direction pads">
              {pads.map((pad, index) => (
                <button
                  key={pad.direction}
                  ref={index === 0 ? firstPadRef : undefined}
                  type="button"
                  className={`game-pad game-pad-${pad.direction}${active === pad.direction ? ' game-pad-active' : ''}`}
                  disabled={stage !== 'playing' || roundFinished}
                  aria-label={`${pad.berry}, ${pad.direction}. ${pad.arrow} arrow or ${pad.key}`}
                  onClick={() => choose(pad.direction)}
                >
                  <svg className="game-berry" viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
                    <path className="game-berry-leaf" d="M14 3h4v5h6v3h-7V8h-3v3H8V8h6Z" />
                    <path className="game-berry-outline" d="M9 10h14v3h4v12h-4v4H9v-4H5V13h4Z" />
                    <path className="game-berry-fruit" d="M10 13h12v3h2v8h-4v2h-8v-2H8v-8h2Z" />
                    <path fill="#fff8e6" d="M11 16h3v3h-3Zm8 5h2v2h-2Z" />
                  </svg>
                  <span className="game-pad-direction">{pad.arrow} <span>{pad.direction}</span></span>
                  <kbd>{pad.key}</kbd>
                </button>
              ))}
            </div>
            <p className="game-cue" aria-live="polite" aria-atomic="true">{stage === 'showing' ? cue || 'Get ready…' : stage === 'playing' ? `${position} / ${sequences[round].length} berries played` : '3 rounds · 3–5 berries · up to 10 points'}</p>
            {stage === 'ready' && <button className="game-primary" type="button" onClick={() => demonstrate(0)}>Let’s play <span aria-hidden="true">→</span></button>}
            {stage === 'showing' && <p className="game-footnote">Pads unlock when it’s your turn.</p>}
            {stage === 'playing' && roundFinished && (
              <button className="game-primary" type="button" onClick={() => {
                if (round < 2) demonstrate(round + 1);
                else setStage('result');
              }}>{round < 2 ? 'Next round →' : 'See my score →'}</button>
            )}
            {stage === 'playing' && !roundFinished && <p className="game-footnote">Take your time. There’s no timer.</p>}
          </>
        ) : (
          <div className="game-result">
            <span className="game-result-sparkle" aria-hidden="true">✧ ✦ ✧</span>
            <h3>A berry sweet effort!</h3>
            <p className="game-score">{score}<span> / 10</span></p>
            <p>You remembered {hits} of 12 berries.<br />A little play makes a happy day.</p>
            <button ref={collectRef} className="game-primary" type="button" disabled={claimed} onClick={collect}>{claimed ? 'Reward collected ✓' : 'Collect reward ✦'}</button>
          </div>
        )}
        <p className="game-exit-note">Esc or × to leave without collecting.</p>
      </div>
    </div>
  );
}
