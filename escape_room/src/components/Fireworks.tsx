import type { CSSProperties } from 'react';
import './Fireworks.css';

export type FireworksVariant = 0 | 1 | 2 | 3;

interface FireworksProps {
  variant: FireworksVariant;
  active: boolean;
  fullScreen?: boolean;
}

const BURST_COLORS = [
  ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff85c0'],
  ['#f687b3', '#f6ad55', '#9ae6b4', '#90cdf4', '#fbd38d'],
  ['#fc8181', '#faf089', '#68d391', '#63b3ed', '#e9d8fd'],
  ['#ed8936', '#ecc94b', '#48bb78', '#4299e1', '#feb2b2'],
];

const BURST_CENTERS = [
  { left: '50%', top: '42%' },
  { left: '28%', top: '55%' },
  { left: '72%', top: '38%' },
  { left: '40%', top: '28%' },
  { left: '62%', top: '62%' },
];

export function Fireworks({ variant, active, fullScreen = false }: FireworksProps) {
  if (!active) {
    return null;
  }

  const colors = BURST_COLORS[variant];
  const className = fullScreen ? 'fireworks fireworks--fullscreen' : 'fireworks';

  return (
    <div className={className} aria-hidden>
      <div className="fireworks__flash" />
      <div className="fireworks__flash fireworks__flash--delayed" />
      {BURST_CENTERS.map((center, i) => (
        <div
          key={i}
          className="fireworks__burst-site"
          style={{ left: center.left, top: center.top }}
        >
          <span
            className="fireworks__core"
            style={{
              backgroundColor: colors[i % colors.length],
              animationDelay: `${i * 0.15}s`,
            }}
          />
        </div>
      ))}
      {variant === 0 && <BurstRings colors={colors} />}
      {variant === 1 && <ParticleSpray colors={colors} />}
      {variant === 2 && <StarBurst colors={colors} />}
      {variant === 3 && <FountainBurst colors={colors} />}
      <BurstRings colors={colors} wave={2} />
    </div>
  );
}

function BurstRings({
  colors,
  wave = 1,
}: {
  colors: string[];
  wave?: number;
}) {
  const delayBase = wave === 2 ? 1.1 : 0;

  return (
    <>
      {colors.flatMap((color, i) =>
        BURST_CENTERS.map((center, ci) => (
          <span
            key={`${wave}-ring-${i}-${ci}`}
            className="fireworks__ring"
            style={{
              borderColor: color,
              animationDelay: `${delayBase + i * 0.12 + ci * 0.08}s`,
              left: center.left,
              top: center.top,
            }}
          />
        )),
      )}
      {BURST_CENTERS.flatMap((center, ci) =>
        Array.from({ length: 20 }, (_, i) => (
          <span
            key={`${wave}-spark-${ci}-${i}`}
            className="fireworks__spark fireworks__spark--burst"
            style={{
              backgroundColor: colors[(i + ci) % colors.length],
              '--angle': `${i * 18}deg`,
              left: center.left,
              top: center.top,
              animationDelay: `${delayBase + (i % 8) * 0.05 + ci * 0.1}s`,
            } as CSSProperties}
          />
        )),
      )}
    </>
  );
}

function ParticleSpray({ colors }: { colors: string[] }) {
  return (
    <>
      {Array.from({ length: 72 }, (_, i) => (
        <span
          key={i}
          className="fireworks__particle"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${8 + (i % 9) * 10}%`,
            top: `${8 + Math.floor(i / 9) * 11}%`,
            animationDelay: `${(i % 12) * 0.06}s`,
            '--tx': `${(i % 9 - 4) * 55}px`,
            '--ty': `${(Math.floor(i / 9) - 3) * -65}px`,
            width: `${8 + (i % 4) * 3}px`,
            height: `${8 + (i % 4) * 3}px`,
          } as CSSProperties}
        />
      ))}
    </>
  );
}

function StarBurst({ colors }: { colors: string[] }) {
  return (
    <>
      {colors.flatMap((color, ci) =>
        Array.from({ length: 8 }, (_, i) => (
          <span
            key={`${ci}-${i}`}
            className="fireworks__star"
            style={{
              color,
              left: `${12 + ci * 16 + (i % 3) * 5}%`,
              top: `${10 + i * 10}%`,
              animationDelay: `${ci * 0.15 + i * 0.08}s`,
              fontSize: `${1.4 + (i % 4) * 0.45}rem`,
            }}
          >
            ✦
          </span>
        )),
      )}
    </>
  );
}

function FountainBurst({ colors }: { colors: string[] }) {
  return (
    <>
      {colors.map((color, ci) => (
        <div
          key={ci}
          className="fireworks__fountain"
          style={{
            left: `${10 + ci * 18}%`,
            '--fountain-color': color,
            animationDelay: `${ci * 0.18}s`,
          } as CSSProperties}
        >
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="fireworks__fountain-drop"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      ))}
    </>
  );
}
