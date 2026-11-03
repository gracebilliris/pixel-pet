import { useId } from 'react';
import './play.css';

type PetSpriteProps = {
  species: 'cat' | 'bunny' | 'bear';
  color: 'peach' | 'mint' | 'lavender';
  sleeping?: boolean;
  mood?: string;
  accessory?: 'none' | 'bow' | 'crown';
  size?: number;
};

const coats = {
  peach: { main: '#ffc6a5', light: '#ffe6cc', shade: '#e99d8d' },
  mint: { main: '#a8ddc4', light: '#d8f1d8', shade: '#7eb7a8' },
  lavender: { main: '#cbb9ec', light: '#e9dafa', shade: '#ab92d0' },
};

export default function PetSprite({
  species,
  color,
  sleeping = false,
  mood = 'happy',
  accessory = 'none',
  size = 180,
}: PetSpriteProps) {
  const titleId = useId();
  const coat = coats[color];
  const subdued = /sad|hungry|tired|low|needs care/i.test(mood);
  const outline = '#594658';

  return (
    <svg
      className={`sprite-pet${sleeping ? ' sprite-sleeping' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      shapeRendering="crispEdges"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{`${sleeping ? 'Sleeping' : mood} ${color} ${species}${accessory !== 'none' ? ` wearing a ${accessory}` : ''}`}</title>
      <g className="sprite-float">
        {species === 'cat' && (
          <g>
            <path fill={outline} d="M12 29V11h4v3h5v4h5v9h12v-9h5v-4h5v-3h4v18Z" />
            <path fill={coat.main} d="M15 27V17h3v3h5v7h18v-7h5v-3h3v10Z" />
            <path fill="#ed9faa" d="M17 25v-5h3v5Zm27 0v-5h3v5Z" />
            <path fill={outline} d="M47 48h7V38h5v14h-4v4H44v-5Z" />
            <path fill={coat.main} d="M48 51h8V41h-1v9h-7Z" />
          </g>
        )}
        {species === 'bunny' && (
          <g>
            <path fill={outline} d="M16 28V8h3V4h7v4h3v20h6V8h3V4h7v4h3v20Z" />
            <path fill={coat.main} d="M19 27V9h3V7h1v2h3v18Zm19 0V9h3V7h1v2h3v18Z" />
            <path fill="#ed9faa" d="M21 12h3v13h-3Zm19 0h3v13h-3Z" />
            <path fill={outline} d="M47 46h8v3h3v7h-3v3h-8Z" />
            <path fill={coat.light} d="M49 49h5v6h-5Z" />
          </g>
        )}
        {species === 'bear' && (
          <g>
            <path fill={outline} d="M10 28V17h3v-4h11v4h3v11Zm27 0V17h3v-4h11v4h3v11Z" />
            <path fill={coat.main} d="M13 25v-7h3v-2h5v2h3v7Zm27 0v-7h3v-2h5v2h3v7Z" />
            <path fill={coat.shade} d="M16 20h5v6h-5Zm27 0h5v6h-5Z" />
          </g>
        )}
        <path fill={outline} d="M20 39h24v4h5v11h-3v6H35v-3h-6v3H18v-6h-3V43h5Z" />
        <path fill={coat.main} d="M22 42h20v3h4v8h-3v4h-5v-4H26v4h-5v-4h-3v-8h4Z" />
        <path fill={coat.light} d="M27 44h10v3h3v6H24v-6h3Z" />
        <path fill={outline} d="M17 22h30v3h5v5h3v12h-3v5h-7v3H19v-3h-7v-5H9V30h3v-5h5Z" />
        <path fill={coat.main} d="M18 25h28v3h5v4h1v8h-3v4h-6v3H21v-3h-6v-4h-3v-8h3v-4h3Z" />
        <path fill={coat.light} d="M19 26h24v2H19Zm-3 5h3v5h-3Z" />
        <path fill={coat.shade} d="M45 42h4v2h-6v3H21v-3h-6v-2h5v2h25Z" />
        <path fill="#ed9faa" d="M16 37h6v3h-6Zm26 0h6v3h-6Z" />
        {species === 'bear' && <path fill={coat.light} d="M26 34h12v3h3v5H23v-5h3Z" />}
        {sleeping ? (
          <path fill="none" stroke={outline} strokeWidth="2" d="M21 34v2h5v-2m12 0v2h5v-2" />
        ) : (
          <g className="sprite-eyes" fill={outline}>
            <path d="M22 31h4v6h-4Zm16 0h4v6h-4Z" />
            <path fill="#fff7ed" d="M23 31h2v2h-2Zm16 0h2v2h-2Z" />
          </g>
        )}
        <path fill={outline} d="M30 36h4v2h-4Z" />
        {sleeping ? (
          <path fill={outline} d="M31 40h3v3h-3Z" />
        ) : subdued ? (
          <path fill="none" stroke={outline} strokeWidth="2" d="M28 42v-2h8v2" />
        ) : (
          <path fill="none" stroke={outline} strokeWidth="2" d="M27 39v2h4v-3m2 0v3h4v-2" />
        )}
        {species === 'cat' && <path fill={outline} d="M10 35h7v1h-7Zm1 5h6v1h-6Zm36-5h7v1h-7Zm0 5h6v1h-6Z" />}
        {accessory === 'bow' && (
          <g>
            <path fill={outline} d="M39 21v-9h4v2h5v-2h4v9h-4v-2h-5v2Z" />
            <path fill="#ef96ae" d="M41 15h2v2h5v-2h2v3h-3v-2h-3v2h-3Z" />
            <path fill="#fff0d9" d="M44 15h3v3h-3Z" />
          </g>
        )}
        {accessory === 'crown' && (
          <g>
            <path fill={outline} d="M22 22V10h4v4h4V8h4v6h4v-4h4v12Z" />
            <path fill="#f3cf75" d="M25 19v-3h5v2h4v-2h5v3Z" />
            <path fill="#ed9faa" d="M31 17h2v3h-2Z" />
          </g>
        )}
      </g>
      {sleeping && (
        <g className="sprite-snooze" fill={outline} aria-hidden="true">
          <path d="M51 17h7v2h-2v2h-2v2h4v2h-7v-2h2v-2h2v-2h-4Z" />
        </g>
      )}
    </svg>
  );
}
