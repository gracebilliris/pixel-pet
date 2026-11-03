export type Species = 'cat' | 'bunny' | 'bear';
export type PetColor = 'peach' | 'mint' | 'lavender';
export type Action = 'feed' | 'play' | 'sleep' | 'clean';
type Accessory = 'none' | 'bow' | 'crown';

export interface PetState {
  version: 1;
  name: string;
  species: Species;
  color: PetColor;
  needs: { food: number; joy: number; energy: number; clean: number };
  coins: number;
  xp: number;
  ageSeconds: number;
  sleeping: boolean;
  paused: boolean;
  lastUpdated: number;
  accessory: Accessory;
  owned: string[];
  history: string[];
}

export const STORAGE_KEY = 'pixel-pet-v1';
const HOUR = 3_600_000;
const MAX_OFFLINE = 8 * HOUR;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const need = (value: number) => clamp(value, 15, 100);
const add = (value: number, amount: number) => Math.min(Number.MAX_SAFE_INTEGER, value + amount);
const cleanName = (name: string) =>
  Array.from(name.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().replace(/\s+/g, ' '))
    .slice(0, 20).join('');
const validTime = (value: number) => Number.isFinite(value) && value >= 0;

function remember(pet: PetState, message: string): { pet: PetState; message: string } {
  return { pet: { ...pet, history: [...pet.history, message].slice(-8) }, message };
}

export function createPet(
  name: string, species: Species, color: PetColor, now = Date.now(),
): PetState {
  return {
    version: 1,
    name: cleanName(name) || 'Pixel',
    species,
    color,
    needs: { food: 80, joy: 80, energy: 85, clean: 90 },
    coins: 30,
    xp: 0,
    ageSeconds: 0,
    sleeping: false,
    paused: false,
    lastUpdated: validTime(now) ? now : Date.now(),
    accessory: 'none',
    owned: ['none'],
    history: [],
  };
}

export function advancePet(pet: PetState, now = Date.now()): PetState {
  const timestamp = validTime(now) ? now : pet.lastUpdated;
  // Rebase a backwards clock immediately, without awarding elapsed time twice.
  const elapsed = pet.paused ? 0 : clamp(timestamp - pet.lastUpdated, 0, MAX_OFFLINE);
  const hours = elapsed / HOUR;
  return {
    ...pet,
    lastUpdated: timestamp,
    ageSeconds: add(pet.ageSeconds, elapsed / 1000),
    needs: {
      food: need(pet.needs.food - hours * 5),
      joy: need(pet.needs.joy - hours * 4),
      energy: need(pet.needs.energy + hours * (pet.sleeping ? 18 : -6)),
      clean: need(pet.needs.clean - hours * 3),
    },
  };
}

export function applyAction(
  pet: PetState, action: Action, now = Date.now(),
): { pet: PetState; message: string } {
  let next = advancePet(pet, now);
  if (next.paused) return { pet: next, message: 'Care is paused. Resume whenever you are ready.' };
  if (action === 'sleep') {
    next = { ...next, sleeping: !next.sleeping };
    return remember(next, next.sleeping ? `${next.name} is settling down to sleep.` : `${next.name} is awake!`);
  }
  if (next.sleeping) return { pet: next, message: `${next.name} is sleeping. Wake them gently first.` };

  const needs = { ...next.needs };
  if (action === 'feed') {
    if (next.coins < 5) return { pet: next, message: 'A snack costs 5 coins. Play together to earn a few.' };
    needs.food = need(needs.food + 22);
    needs.clean = need(needs.clean - 2);
    next = { ...next, needs, coins: next.coins - 5, xp: add(next.xp, 3) };
    return remember(next, `${next.name} enjoyed a tasty snack!`);
  }
  if (action === 'play') {
    if (needs.energy <= 20) return { pet: next, message: `${next.name} needs a little rest before playing.` };
    needs.joy = need(needs.joy + 20);
    needs.energy = need(needs.energy - 12);
    needs.food = need(needs.food - 3);
    next = { ...next, needs, coins: add(next.coins, 3), xp: add(next.xp, 5) };
    return remember(next, `Playtime! ${next.name} earned 3 coins.`);
  }
  needs.clean = need(needs.clean + 25);
  needs.joy = need(needs.joy + 3);
  next = { ...next, needs, xp: add(next.xp, 3) };
  return remember(next, `${next.name} is fresh and cosy!`);
}

/** Growth can come from time together or earned experience; neither requires constant care. */
export function getStage(pet: PetState): string {
  if (pet.ageSeconds >= 86_400 || pet.xp >= 150) return 'Grown';
  if (pet.ageSeconds >= 3_600 || pet.xp >= 30) return 'Growing';
  return 'Baby';
}

export function getMood(pet: PetState): string {
  if (pet.paused) return 'Paused';
  if (pet.sleeping) return 'Sleeping';
  const lowest = Math.min(...Object.values(pet.needs));
  if (lowest <= 30) return 'Needs care';
  return lowest >= 70 ? 'Happy' : 'Content';
}

export function rewardGame(
  pet: PetState, score: number, now = Date.now(),
): { pet: PetState; message: string } {
  const next = advancePet(pet, now);
  if (next.paused || next.sleeping) {
    return { pet: next, message: next.paused ? 'Resume care before playing.' : 'Wake your pet before playing.' };
  }
  const reward = Number.isFinite(score) ? Math.floor(clamp(score, 0, 10)) : 0;
  if (!reward) return { pet: next, message: 'Thanks for playing! Try again whenever you like.' };
  return remember({
    ...next,
    coins: add(next.coins, reward),
    xp: add(next.xp, reward * 2),
    needs: { ...next.needs, joy: need(next.needs.joy + reward), energy: need(next.needs.energy - reward) },
  }, `Lovely playing! You earned ${reward} coins.`);
}

export function buyAccessory(
  pet: PetState, accessory: 'bow' | 'crown',
): { pet: PetState; message: string } {
  if (pet.owned.includes(accessory)) {
    const equipped = pet.accessory === accessory ? 'none' : accessory;
    return remember({ ...pet, accessory: equipped }, equipped === 'none'
      ? 'Accessory tucked away.' : `${pet.name} is wearing the ${accessory}!`);
  }
  const cost = accessory === 'bow' ? 25 : 60;
  if (pet.coins < cost) return { pet, message: `The ${accessory} costs ${cost} coins. No rush!` };
  return remember({
    ...pet, coins: pet.coins - cost, accessory, owned: [...pet.owned, accessory],
  }, `${pet.name} has a new ${accessory}!`);
}

export function setPaused(pet: PetState, paused: boolean, now = Date.now()): PetState {
  return { ...advancePet(pet, now), paused };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function parsePet(value: unknown): PetState | null {
  if (!isRecord(value) || value.version !== 1 ||
    typeof value.name !== 'string' || !cleanName(value.name) ||
    !['cat', 'bunny', 'bear'].includes(value.species as string) ||
    !['peach', 'mint', 'lavender'].includes(value.color as string) ||
    !isRecord(value.needs) ||
    !['food', 'joy', 'energy', 'clean'].every(key => {
      const n = value.needs as Record<string, unknown>;
      return typeof n[key] === 'number' && Number.isFinite(n[key]) && n[key] >= 15 && n[key] <= 100;
    }) ||
    !isCounter(value.coins) || !isCounter(value.xp) ||
    typeof value.ageSeconds !== 'number' || !Number.isFinite(value.ageSeconds) ||
    value.ageSeconds < 0 || value.ageSeconds > Number.MAX_SAFE_INTEGER ||
    typeof value.lastUpdated !== 'number' || !validTime(value.lastUpdated) ||
    typeof value.sleeping !== 'boolean' || typeof value.paused !== 'boolean' ||
    !['none', 'bow', 'crown'].includes(value.accessory as string) ||
    !Array.isArray(value.owned) || !value.owned.every(item =>
      typeof item === 'string' && ['none', 'bow', 'crown'].includes(item)) ||
    new Set(value.owned).size !== value.owned.length ||
    (value.accessory !== 'none' && !value.owned.includes(value.accessory)) ||
    !Array.isArray(value.history) || !value.history.every(item => typeof item === 'string')) return null;

  const pet = value as unknown as PetState;
  return {
    ...pet,
    name: cleanName(pet.name),
    needs: { ...pet.needs },
    owned: [...pet.owned],
    history: pet.history.slice(-8).map(item => item.slice(0, 200)),
  };
}

// Resolve browser storage inside the try: its getter can throw, and SSR has no localStorage.
export function savePet(pet: PetState, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const valid = parsePet(pet);
    if (!valid) return false;
    (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}

export function loadPet(
  storage?: Pick<Storage, 'getItem'>, now = Date.now(),
): PetState | null {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(STORAGE_KEY);
    if (!raw) return null;
    const pet = parsePet(JSON.parse(raw));
    return pet ? advancePet(pet, now) : null;
  } catch {
    return null;
  }
}
