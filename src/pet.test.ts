import { describe, expect, it, vi } from 'vitest';
import {
  advancePet, applyAction, buyAccessory, createPet, getMood, getStage,
  loadPet, rewardGame, savePet, setPaused, STORAGE_KEY,
} from './pet';

const START = 1_000_000;
const HOUR = 3_600_000;
const fresh = () => createPet('Mochi', 'cat', 'peach', START);

describe('gentle time and growth', () => {
  it('cleans names, limits them to 20 characters, and supplies a fallback', () => {
    expect(createPet(' \u0000  Little   friend \n', 'bunny', 'mint', START).name).toBe('Little friend');
    expect(createPet('🌷'.repeat(25), 'bear', 'lavender', START).name).toBe('🌷'.repeat(20));
    expect(createPet(' \n ', 'cat', 'peach', START).name).toBe('Pixel');
  });

  it('advances needs and age without mutating its input', () => {
    const pet = fresh();
    const next = advancePet(pet, START + HOUR);
    expect(next.ageSeconds).toBe(3600);
    expect(next.needs).toEqual({ food: 75, joy: 76, energy: 79, clean: 87 });
    expect(pet).toEqual(fresh());
    expect(advancePet(next, next.lastUpdated)).toEqual(next);
  });

  it('caps an offline gap at eight hours and never lets needs fall below 15', () => {
    const next = advancePet(fresh(), START + 72 * HOUR);
    expect(next.ageSeconds).toBe(8 * 3600);
    expect(next).toEqual(advancePet(next, START + 72 * HOUR));
    const older = advancePet(next, START + 80 * HOUR);
    expect(older.needs.energy).toBe(15);
    expect(Math.min(...Object.values(older.needs))).toBeGreaterThanOrEqual(15);
  });

  it('rebases a backwards clock without granting time or freezing future progress', () => {
    const next = advancePet(fresh(), START - 1000);
    expect(next.ageSeconds).toBe(0);
    expect(next.needs).toEqual(fresh().needs);
    expect(advancePet(next, START).ageSeconds).toBe(1);
    expect(advancePet(next, Number.NaN)).toEqual(next);
  });

  it('derives growth from time or experience, and mood from needs and rest', () => {
    expect(getStage(fresh())).toBe('Baby');
    expect(getStage(advancePet(fresh(), START + HOUR))).toBe('Growing');
    expect(getStage({ ...fresh(), xp: 150 })).toBe('Grown');
    expect(getMood(fresh())).toBe('Happy');
    expect(getMood({ ...fresh(), needs: { ...fresh().needs, food: 15 } })).toBe('Needs care');
    expect(getMood({ ...fresh(), sleeping: true })).toBe('Sleeping');
  });
});

describe('care, sleep, and pause', () => {
  it('charges 5 coins for food and refuses an unaffordable snack', () => {
    const next = applyAction(fresh(), 'feed', START).pet;
    expect(next.coins).toBe(25);
    expect(next.needs.food).toBe(100);
    expect(next.xp).toBeGreaterThan(0);
    const poor = { ...fresh(), coins: 4 };
    const result = applyAction(poor, 'feed', START);
    expect(result.pet).toEqual(poor);
    expect(result.message).toMatch(/5 coins/);
  });

  it('offers free play for small rewards at an energy cost, and free cleaning', () => {
    const pet = { ...fresh(), coins: 0 };
    const played = applyAction(pet, 'play', START).pet;
    expect(played.coins).toBe(3);
    expect(played.xp).toBeGreaterThan(pet.xp);
    expect(played.needs.energy).toBeLessThan(pet.needs.energy);
    const dirty = { ...pet, needs: { ...pet.needs, clean: 15 } };
    const cleaned = applyAction(dirty, 'clean', START).pet;
    expect(cleaned.coins).toBe(0);
    expect(cleaned.needs.clean).toBeGreaterThan(dirty.needs.clean);
    const tired = { ...pet, needs: { ...pet.needs, energy: 15 } };
    expect(applyAction(tired, 'play', START).pet).toEqual(tired);
  });

  it('restores energy during sleep and applies sleep/awake rates across transitions', () => {
    const pet = { ...fresh(), needs: { ...fresh().needs, energy: 30 } };
    const sleeping = applyAction(pet, 'sleep', START).pet;
    const awake = applyAction(sleeping, 'sleep', START + HOUR).pet;
    expect(awake.sleeping).toBe(false);
    expect(awake.needs.energy).toBe(48);
    expect(advancePet(awake, START + 2 * HOUR).needs.energy).toBe(42);
    expect(advancePet(sleeping, START + 8 * HOUR).needs.energy).toBe(100);
  });

  it.each(['feed', 'play', 'clean'] as const)('blocks %s while sleeping with feedback', action => {
    const pet = { ...fresh(), sleeping: true };
    const result = applyAction(pet, action, START);
    expect(result.pet).toEqual(pet);
    expect(result.message).toMatch(/sleeping/);
  });

  it('accounts for pre-pause time but neither ages nor decays during pause or resumption', () => {
    const paused = setPaused(fresh(), true, START + HOUR);
    const resumed = setPaused(paused, false, START + 10 * HOUR);
    expect(resumed.ageSeconds).toBe(3600);
    expect(resumed.needs).toEqual(paused.needs);
    expect(advancePet(resumed, START + 11 * HOUR).ageSeconds).toBe(7200);
    expect(applyAction(paused, 'sleep', START + 2 * HOUR).pet.sleeping).toBe(false);
    expect(rewardGame(paused, 10, START + 2 * HOUR).pet.coins).toBe(paused.coins);
  });

  it('keeps bounded recent history and does not mutate prior history', () => {
    const original = fresh();
    let pet = original;
    for (let i = 0; i < 12; i++) pet = applyAction(pet, 'clean', START).pet;
    expect(pet.history).toHaveLength(8);
    expect(original.history).toEqual([]);
  });
});

describe('games and accessories', () => {
  it.each([
    [-10, 0], [0, 0], [2.9, 2], [1000, 10], [Number.NaN, 0], [Infinity, 0],
  ])('bounds score %s to a reward of %s', (score, expected) => {
    const pet = fresh();
    const result = rewardGame(pet, score, START).pet;
    expect(result.coins - pet.coins).toBe(expected);
    expect(result.xp - pet.xp).toBe(expected * 2);
  });

  it('does not reward sleeping pets', () => {
    const pet = { ...fresh(), sleeping: true };
    expect(rewardGame(pet, 10, START).pet).toEqual(pet);
  });

  it.each([['bow', 25], ['crown', 60]] as const)('charges once for a %s, then toggles freely', (accessory, cost) => {
    const pet = { ...fresh(), coins: 100 };
    const bought = buyAccessory(pet, accessory).pet;
    expect(bought.coins).toBe(100 - cost);
    expect(bought.accessory).toBe(accessory);
    const removed = buyAccessory(bought, accessory).pet;
    expect(removed.accessory).toBe('none');
    const equipped = buyAccessory(removed, accessory).pet;
    expect(equipped.accessory).toBe(accessory);
    expect(equipped.coins).toBe(bought.coins);
    expect(equipped.owned.filter(item => item === accessory)).toHaveLength(1);
    expect(pet.owned).toEqual(['none']);
  });

  it('leaves unaffordable purchases unchanged', () => {
    const pet = { ...fresh(), coins: 24 };
    expect(buyAccessory(pet, 'bow').pet).toEqual(pet);
    expect(buyAccessory(fresh(), 'crown').pet).toEqual(fresh());
  });
});

describe('safe persistence', () => {
  it('round-trips through the specified storage key and applies offline time once', () => {
    const values = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => { values.set(key, value); },
      getItem: (key: string) => values.get(key) ?? null,
    };
    expect(savePet(fresh(), storage)).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true);
    const loaded = loadPet(storage, START + HOUR)!;
    expect(loaded).toEqual(advancePet(fresh(), START + HOUR));
    savePet(loaded, storage);
    expect(loadPet(storage, START + HOUR)).toEqual(loaded);
  });

  it.each([
    null, [], {}, { version: 2 }, { species: 'fox' }, { color: 'blue' },
    { name: 7 }, { name: '' }, { coins: -1 }, { coins: 1.5 }, { xp: '10' },
    { ageSeconds: -1 }, { lastUpdated: 'yesterday' }, { sleeping: 'false' }, { paused: null },
    { needs: { food: 101, joy: 80, energy: 80, clean: 80 } },
    { needs: { food: 14, joy: 80, energy: 80, clean: 80 } },
    { needs: { food: 80 } }, { accessory: 'hat' }, { accessory: 'crown' },
    { owned: ['hat'] }, { owned: ['bow', 'bow'] }, { history: [5] },
  ])('rejects malformed or incompatible saves: %j', corruption => {
    const value = corruption === null || Array.isArray(corruption) || Object.keys(corruption).length === 0
      ? corruption : { ...fresh(), ...corruption };
    expect(loadPet({ getItem: () => JSON.stringify(value) }, START)).toBeNull();
  });

  it('rejects missing data and invalid JSON', () => {
    expect(loadPet({ getItem: () => null }, START)).toBeNull();
    expect(loadPet({ getItem: () => '{broken' }, START)).toBeNull();
  });

  it('handles unavailable browser storage and quota/security exceptions', () => {
    expect(savePet(fresh(), { setItem: () => { throw new Error('quota'); } })).toBe(false);
    expect(loadPet({ getItem: () => { throw new Error('denied'); } })).toBeNull();
    vi.stubGlobal('localStorage', undefined);
    try {
      expect(savePet(fresh())).toBe(false);
      expect(loadPet()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('cleans loaded names and safely rebases a future save timestamp', () => {
    const saved = { ...fresh(), name: '  My   pet  ', lastUpdated: START + HOUR };
    const loaded = loadPet({ getItem: () => JSON.stringify(saved) }, START)!;
    expect(loaded.name).toBe('My pet');
    expect(loaded.ageSeconds).toBe(0);
    expect(advancePet(loaded, START + 1000).ageSeconds).toBe(1);
  });

  it('does not overwrite storage with invalid state', () => {
    const setItem = vi.fn();
    expect(savePet({ ...fresh(), coins: Infinity }, { setItem })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });
});
