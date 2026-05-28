import { TYPES } from "../config/constants.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function beats(a, b) {
  return (a === TYPES.ROCK && b === TYPES.SCISSORS)
    || (a === TYPES.SCISSORS && b === TYPES.PAPER)
    || (a === TYPES.PAPER && b === TYPES.ROCK);
}

export function preyType(type) {
  return (type + 1) % 3;
}

export function predatorType(type) {
  return (type + 2) % 3;
}
