import { useEffect, useRef, useState } from 'react';
import PetSprite from './PetSprite';
import MiniGame from './MiniGame';
import {
  advancePet, applyAction, buyAccessory, createPet, getMood, getStage, loadPet,
  rewardGame, savePet, setPaused, type Action, type PetColor, type PetState, type Species,
} from './pet';

type IconName = 'heart' | 'coin' | 'food' | 'play' | 'moon' | 'clean' | 'leaf' | 'check' | 'pause' | 'sun' | 'spark';
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M14.5 7H11a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5H9.5M12 5v14" /></>,
    food: <><path d="M3 11h18a9 9 0 0 1-18 0ZM6 21h12M7 7V4m5 3V2m5 5V4" /></>,
    play: <><path d="M7 7h10c5 0 7 12 3 12-2 0-4-4-4-4H8s-2 4-4 4C0 19 2 7 7 7Z" /><path d="M6 10v5m-2.5-2.5h5M16 11h.01M19 14h.01" /></>,
    moon: <path d="M20.5 13A9 9 0 0 1 11 3a9 9 0 1 0 9.5 10Z" />,
    clean: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8ZM20 16v6m-3-3h6M4 3v4M2 5h4" /></>,
    leaf: <><path d="M20 3C4 1 1 11 7 17c7 6 16-2 13-14Z" /><path d="M3 21 16 8m-9 9v-6m5 1h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
    spark: <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function RoomArt() {
  return <svg className="room-art" viewBox="0 0 700 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><pattern id="wall" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M18 2v3M16.5 3.5h3" stroke="#bfd3ac" strokeWidth="1.5" /></pattern></defs>
    <path fill="#e1e9cc" d="M0 0h700v420H0z" /><path fill="url(#wall)" d="M0 0h700v294H0z" />
    <path fill="#d0d6b3" d="M0 288h700v9H0z" /><path fill="#eee2be" d="M0 297h700v123H0z" />
    <path stroke="#e0d0a6" strokeWidth="2" d="M0 342h700M0 391h700M100 297v45m175 0v49m175-94v45m170 0v49M80 391v29m455-29v29" />
    <path fill="#f7f2d8" d="M245 42h210v180H245z" /><path fill="#79957d" d="M254 51h192v160H254z" /><path fill="#c5e1d7" d="M263 60h174v142H263z" />
    <path fill="#fbf4cb" d="M383 76h20v7h7v20h-7v7h-20v-7h-7V83h7z" />
    <path fill="#a2c6ad" d="m263 170 34-32h25l31 26 34-15h20l30 28v25H263z" />
    <path fill="#8bb096" d="m263 188 52-28 43 23 36-14 43 24v9H263z" />
    <path fill="#f7f2d8" d="M344 55h12v152H344zM258 125h184v10H258zM237 211h226v12H237z" />
    <path fill="#9fae80" d="M78 256h11v48H78zM63 241h16v33H63zM88 229h16v36H88zM48 224h22v24H48zM93 211h24v25H93zM70 208h20v27H70z" />
    <path fill="#d4926c" d="M55 278h53v15h-5v31H61v-31h-6z" /><path fill="#bd7d5d" d="M60 293h43v7H60z" />
    <path fill="#b28c65" d="M553 229h78v9h-78zM560 238h7v61h-7zM616 238h7v61h-7z" />
    <path fill="#e8b3a5" d="M563 207h15v22h-15z" /><path fill="#91ab8a" d="M568 190h6v17h-6zM557 188h12v10h-12zM574 180h12v14h-12z" />
    <path fill="#e5cb80" d="M595 211h26v18h-26z" /><path fill="#f7edc9" d="M599 215h18v4h-18z" />
    <ellipse cx="350" cy="356" rx="131" ry="33" fill="#c4bcb2" opacity=".27" />
    <ellipse cx="350" cy="352" rx="125" ry="31" fill="#e8ac8f" /><ellipse cx="350" cy="351" rx="111" ry="24" fill="none" stroke="#f4c6a9" strokeWidth="3" />
    <path fill="#899d7a" d="M45 65h44v42H45z" /><path fill="#f3e8c9" d="M50 70h34v32H50z" /><path fill="#c7cfa7" d="M58 90h19v7H58zM63 79h9v12h-9z" />
  </svg>;
}

const care: { action: Action; icon: IconName; title: string; caption: string; tint: string }[] = [
  { action: 'feed', icon: 'food', title: 'Feed', caption: '5 coins · +22 food', tint: 'peach' },
  { action: 'play', icon: 'play', title: 'Play', caption: '+3 coins · −12 energy', tint: 'yellow' },
  { action: 'sleep', icon: 'moon', title: 'Sleep', caption: 'Rest & recharge', tint: 'purple' },
  { action: 'clean', icon: 'clean', title: 'Clean', caption: 'Free · +25 freshness', tint: 'mint' },
];

export default function App() {
  const [pet, setPet] = useState<PetState | null>(() => loadPet());
  const [name, setName] = useState('Mochi');
  const [species, setSpecies] = useState<Species>('cat');
  const [color, setColor] = useState<PetColor>('peach');
  const [message, setMessage] = useState('A little care goes a long way.');
  const [game, setGame] = useState(false);
  const [guide, setGuide] = useState(false);
  const [saved, setSaved] = useState(true);
  const [clock, setClock] = useState(Date.now());
  const [reduced, setReduced] = useState(false);
  const gameButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      setPet(current => current ? advancePet(current, now) : null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { if (pet) setSaved(savePet(pet)); }, [pet]);
  useEffect(() => {
    try { setReduced(localStorage.getItem('pixel-pet-still') === 'true'); } catch { /* Optional preference. */ }
  }, []);

  const preview = pet ?? createPet(name, species, color);
  const mood = getMood(preview);
  const stage = getStage(preview);
  const growth = stage === 'Grown' ? 100 : Math.min(100, Math.max((preview.xp / (stage === 'Baby' ? 30 : 150)) * 100, preview.ageSeconds / (stage === 'Baby' ? 3600 : 86400) * 100));
  const disabled = !pet || pet.paused;
  const clockText = new Date(clock).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function act(action: Action) {
    if (!pet) return;
    const result = applyAction(pet, action);
    setPet(result.pet);
    setMessage(result.message);
  }
  function purchase(item: 'bow' | 'crown') {
    if (!pet) return;
    const result = buyAccessory(pet, item);
    setPet(result.pet); setMessage(result.message);
  }
  function toggleMotion() {
    setReduced(!reduced);
    try { localStorage.setItem('pixel-pet-still', String(!reduced)); } catch { /* Care still works without storage. */ }
  }

  return <div className={`app${reduced || pet?.paused ? ' still' : ''}`}>
    <header className="site-header">
      <a className="brand" href="./" aria-label="Pixel Pet home"><span className="brand-mark">▟</span>pixel<span>pet</span><span className="brand-dot">✦</span></a>
      <nav aria-label="Main navigation"><button className={!guide ? 'nav-active' : ''} onClick={() => setGuide(false)}>My little world</button><button className={guide ? 'nav-active' : ''} onClick={() => setGuide(!guide)}>How to play</button></nav>
      <span className="save-badge"><span className={saved ? 'status-dot' : 'status-dot warning'} />{pet ? saved ? 'Saved on this device' : 'Save unavailable' : 'Your cozy corner awaits'}</span>
    </header>

    <main>
      <section className="intro">
        <div><p className="eyebrow"><Icon name="spark" size={14} /> A LITTLE FRIEND. A LITTLE JOY.</p><h1>{pet ? <>Life’s sweeter with <span>{pet.name}.</span></> : <>Small friend. <span>Big happy.</span></>}</h1><p className="intro-copy">{pet ? 'A snack, a nap, a little play. Make a little time for your little friend.' : 'Meet your new pocket-sized companion. A cozy little world, made for you.'}</p></div>
        <div className="today"><span>YOUR LITTLE WORLD</span><strong><Icon name="sun" size={19} /> {clockText}</strong><small>Always a good time to say hello.</small></div>
      </section>

      {guide && <section className="guide-card" aria-label="How to play"><div><h2>A small guide to a happy pet</h2><p>Adopt a cat, bunny, or bear. Snacks cost 5 coins; playing together earns 3. Rest restores 18 energy an hour. Cleaning is always free. Match berries to earn up to 10 coins, then try a new accessory.</p><p>Grow from Baby to Growing after 30 XP or one active hour, then Grown at 150 XP or a day. Gentle offline progress stops at 8 hours, needs never fall below 15, and your friend never dies. Pause freezes care and growth. Saves stay in this browser—not across devices. Clearing browser data removes them. After loading, care needs no network; reopening offline is not guaranteed.</p></div><button className="text-button" onClick={() => setGuide(false)}>Got it ×</button></section>}

      {!saved && <p className="storage-warning" role="alert">Your browser couldn’t save. You can still play, but progress may be lost on reload. Allow local storage to keep your pet.</p>}

      <div className="dashboard">
        <section className="habitat-card" aria-label={`${preview.name || 'Your pet'}’s room`}>
          <div className="room-top"><span className="room-label"><span className="status-dot" /> THE COZY CORNER</span><span className="room-weather"><Icon name={preview.sleeping ? 'moon' : 'sun'} size={16} /> {preview.sleeping ? 'Dream time' : 'A lovely little day'}</span></div>
          <div className={`room${preview.sleeping ? ' room-night' : ''}`}>
            <RoomArt />
            <div className="room-bubble">{preview.paused ? 'Taking a little pause ♡' : preview.sleeping ? 'zzZ… berry dreams.' : preview.needs.food < 35 ? 'A snack would be lovely…' : preview.needs.energy < 30 ? 'Time for a cozy nap?' : preview.needs.clean < 35 ? 'Bubble bath, please?' : preview.needs.joy < 35 ? 'Shall we play together?' : 'So happy you’re here! ♡'}</div>
            <div className="room-pet"><PetSprite species={preview.species} color={preview.color} sleeping={preview.sleeping} mood={mood} accessory={preview.accessory} size={188} /></div>
            <span className="room-spark room-spark-one">✦</span><span className="room-spark room-spark-two">✧</span>
            {preview.paused && <div className="pause-veil"><Icon name="pause" /> Care is paused</div>}
          </div>
          <div className="pet-caption"><div><span className="pet-name">{preview.name || 'Your little friend'}</span><span className="stage-tag">{stage} {preview.species}</span><p><span className="happy-dot" /> {pet ? mood : 'Ready to meet you'} <span className="caption-divider">·</span> {pet ? `${Math.floor(preview.ageSeconds / 3600)}h together` : 'A friendship waiting to happen'}</p></div><div className="love-stamp"><Icon name="heart" size={24} /></div></div>
          <div className="growth-row"><div><Icon name="leaf" size={16} /><span>{stage === 'Grown' ? 'All grown, always your baby' : 'Growing a little every day'}</span><strong>{preview.xp} XP</strong></div><div className="growth-track" role="progressbar" aria-label="Growth to next stage" aria-valuenow={Math.round(growth)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${growth}%` }} /></div></div>
        </section>

        {!pet ? <section className="care-panel adoption"><p className="eyebrow">HELLO, NEW FRIEND</p><h2>Make it your own.</h2><p className="panel-copy">A tiny companion, a fresh start.</p>
          <form onSubmit={event => { event.preventDefault(); const next = createPet(name, species, color); setPet(next); setMessage(`Welcome home, ${next.name}! You have 30 coins to get cozy.`); }}>
            <label className="field-label" htmlFor="pet-name">Their little name</label><input id="pet-name" maxLength={20} value={name} onChange={event => setName(event.target.value)} placeholder="Mochi" autoComplete="off" />
            <fieldset><legend>Pick a pal</legend><div className="species-options">{(['cat', 'bunny', 'bear'] as Species[]).map(item => <button key={item} type="button" className={species === item ? 'species selected' : 'species'} aria-pressed={species === item} onClick={() => setSpecies(item)}><PetSprite species={item} color={color} size={47} /><span>{item}</span></button>)}</div></fieldset>
            <fieldset><legend>A splash of color</legend><div className="color-options">{(['peach', 'mint', 'lavender'] as PetColor[]).map(item => <button type="button" key={item} className={`color-swatch ${item}${color === item ? ' selected' : ''}`} aria-label={item} aria-pressed={color === item} onClick={() => setColor(item)}>{color === item && <Icon name="check" size={18} />}</button>)}<span>{color.charAt(0).toUpperCase() + color.slice(1)}</span></div></fieldset>
            <button type="submit" className="primary adopt-button">Bring {name.trim() || 'Pixel'} home <span>→</span></button><p className="adoption-note"><Icon name="heart" size={13} /> No pressure. Just a little love.</p>
          </form>
        </section> : <section className="care-panel">
          <div className="panel-heading"><div><p className="eyebrow">THE LITTLE THINGS</p><h2>A little tender care.</h2></div><span className="coin-balance" aria-label={`${pet.coins} coins`}><Icon name="coin" size={19} /><strong data-testid="coins">{pet.coins}</strong></span></div>
          <div className="needs-list">{([
            ['food', 'Tummy', 'food', 'peach'], ['joy', 'Happiness', 'heart', 'yellow'], ['energy', 'Energy', 'moon', 'purple'], ['clean', 'Freshness', 'clean', 'mint'],
          ] as const).map(([key, title, icon, tint]) => <div className={`need need-${tint}`} key={key}><div><span><Icon name={icon} size={17} />{title}</span><strong>{Math.round(pet.needs[key])}<small>/100</small></strong></div><div className="need-track" role="progressbar" aria-label={title} aria-valuenow={Math.round(pet.needs[key])} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pet.needs[key]}%` }} /></div></div>)}</div>
          <div className="care-actions">{care.map(item => <button key={item.action} className={`care-action action-${item.tint}`} disabled={disabled || (pet.sleeping && item.action !== 'sleep')} onClick={() => act(item.action)}><Icon name={item.action === 'sleep' && pet.sleeping ? 'sun' : item.icon} size={25} /><strong>{item.action === 'sleep' && pet.sleeping ? 'Wake up' : item.title}</strong><span>{item.caption}</span></button>)}</div>
          <div className="care-note" role="status" aria-live="polite"><Icon name="heart" size={16} /><span>{message}</span></div>
        </section>}
      </div>

      <section className="extras-grid" aria-label="More little joys">
        <article className="play-card"><div className="berry-illustration" aria-hidden="true"><span>✦</span><svg viewBox="0 0 64 64" shapeRendering="crispEdges"><path fill="#517b55" d="M26 8h8v9h13v7H20v-7h6z" /><path fill="#ae5148" d="M14 24h34v8h7v14h-7v8h-8v6H25v-6h-8v-8h-7V32h4z" /><path fill="#e58a76" d="M18 29h26v5h5v9h-6v8H27v-5h-9z" /><path fill="#ffe4ac" d="M23 33h4v5h-4zm12 8h4v5h-4zm3-11h4v4h-4z" /></svg><span>✧</span></div><div className="play-copy"><p className="eyebrow">PLAY A LITTLE, EARN A LITTLE</p><h2>Berry good times.</h2><p>Match the berry rhythm. Make sweet memories.<br />Earn up to 10 coins each game.</p><button ref={gameButton} className="text-button game-launch" disabled={disabled || pet?.sleeping} onClick={() => setGame(true)}>Let’s play <span>↗</span></button>{pet?.sleeping && <small className="unlock-note">Wake your friend to play.</small>}{!pet && <small className="unlock-note">Adopt your pal to unlock.</small>}</div></article>
        <article className="wardrobe-card"><div className="section-heading"><div><p className="eyebrow">LITTLE EXTRAS</p><h2>A touch of personality.</h2></div><span className="tiny-tag">WARDROBE</span></div><div className="shop-items">{(['bow', 'crown'] as const).map(item => <button className="shop-item" key={item} disabled={!pet || pet.paused} onClick={() => purchase(item)}><span className={`shop-art shop-${item}`} aria-hidden="true">{item === 'bow' ? '⑅' : '♛'}</span><span><strong>{item === 'bow' ? 'Little bow' : 'Sunny crown'}</strong><small>{pet?.owned.includes(item) ? pet.accessory === item ? 'Wearing · tap to remove' : 'Owned · tap to wear' : `${item === 'bow' ? 25 : 60} coins`}</small></span><span className="shop-plus">{pet?.accessory === item ? '✓' : '+'}</span></button>)}</div></article>
      </section>
      <footer className="world-footer"><p><Icon name="leaf" size={16} /> Little moments. Lasting friendships.</p><div><label className="motion-toggle"><input type="checkbox" checked={reduced} onChange={toggleMotion} /> Still mode</label>{pet && <><button onClick={() => { setPet(setPaused(pet, !pet.paused)); setMessage(pet.paused ? 'Welcome back. Let’s take it gently.' : 'Care is paused. Your friend will wait for you.'); }} className="footer-button"><Icon name={pet.paused ? 'play' : 'pause'} size={14} />{pet.paused ? 'Resume' : 'Pause care'}</button><button className="footer-button reset-button" onClick={() => { if (window.confirm(`Start a new friendship? This permanently removes ${pet.name} and their progress from this browser.`)) { try { localStorage.removeItem('pixel-pet-v1'); } catch { setSaved(false); } setPet(null); setMessage('A little care goes a long way.'); } }}>New pet</button></>}</div></footer>
      <p className="privacy-note">Just you and your pet. No accounts, no streaks, no goodbyes. ♡</p>
    </main>
    {game && pet && <MiniGame onClose={() => { setGame(false); gameButton.current?.focus(); }} onComplete={score => { const result = rewardGame(pet, score); setPet(result.pet); setMessage(result.message); setGame(false); gameButton.current?.focus(); }} />}
  </div>;
}
