export const SNAKES = {
  98: 40,
  87: 49,
  62: 19,
  54: 34,
  36: 17,
  28: 10,
}

export const LADDERS = {
  4: 25,
  9: 31,
  21: 42,
  28: 55,
  51: 67,
  71: 91,
  80: 99,
}

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1
}

export function movePlayer(position, dice) {
  const target = position + dice

  if (target > 100) {
    return {
      position,
      message: `You rolled ${dice}, but need an exact roll to reach 100.`,
    }
  }

  if (LADDERS[target]) {
    return {
      position: LADDERS[target],
      message: `Ladder! ${target} -> ${LADDERS[target]}`,
    }
  }

  if (SNAKES[target]) {
    return {
      position: SNAKES[target],
      message: `Snake! ${target} -> ${SNAKES[target]}`,
    }
  }

  return {
    position: target,
    message: `Moved to square ${target}.`,
  }
}