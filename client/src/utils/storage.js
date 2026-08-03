const KEY = 'snake_ladder_player'

export function getPlayer() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function savePlayer(player) {
  localStorage.setItem(KEY, JSON.stringify(player))
}

export function clearPlayer() {
  localStorage.removeItem(KEY)
}