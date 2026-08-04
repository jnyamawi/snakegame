import crypto from 'crypto'
import { movePlayer, rollDice } from './gameLogic.js'

const rooms = new Map()

const MIN_PLAYERS = 2
const MAX_PLAYERS = 4

function makeRoomId() {
  let id

  do {
    id = crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()
  } while (rooms.has(id))

  return id
}

// CREATE ROOM
export function createRoom(player, maxPlayers = 2) {
  const selectedPlayers = Number(maxPlayers)

  if (
    !Number.isInteger(selectedPlayers) ||
    selectedPlayers < MIN_PLAYERS ||
    selectedPlayers > MAX_PLAYERS
  ) {
    throw new Error(
      'Number of players must be between 2 and 4.'
    )
  }

  const roomId = makeRoomId()

  const room = {
    roomId,

    // Maximum players selected by host
    maxPlayers: selectedPlayers,

    // Host
    host: player.id,

    // Game status
    status: 'waiting',

    // Whose turn
    currentTurn: null,

    // Winner
    winner: null,

    // Players
    players: new Map([
      [
        player.id,
        {
          id: player.id,
          name: player.name,
          position: 0,
          connected: true,
        },
      ],
    ]),

    // Player win counts
    wins: new Map([[player.id, 0]]),

    // Last move
    lastMove: null,
  }

  rooms.set(roomId, room)

  return room
}

// GET ROOM
export function getRoom(roomId) {
  return rooms.get(roomId)
}

// PUBLIC ROOM DATA
function publicRoom(room) {
  return {
    roomId: room.roomId,

    // Send maximum player count to frontend
    maxPlayers: room.maxPlayers,

    host: room.host,

    status: room.status,

    currentTurn: room.currentTurn,

    winner: room.winner,

    players: [...room.players.values()].map(
      (player) => ({
        id: player.id,
        name: player.name,
        position: player.position,
        host: player.id === room.host,
        connected: player.connected,
        wins: room.wins.get(player.id) ?? 0,
      })
    ),

    lastMove: room.lastMove,
  }
}

// ADD PLAYER
export function addPlayer(room, player) {
  if (!room) {
    throw new Error('Room not found.')
  }

  if (room.status !== 'waiting') {
    throw new Error(
      'This game has already started.'
    )
  }

  // IMPORTANT:
  // Use the room's selected player limit
  if (room.players.size >= room.maxPlayers) {
    throw new Error(
      `This room is full. Maximum players: ${room.maxPlayers}.`
    )
  }

  if (room.players.has(player.id)) {
    throw new Error(
      'Player already in room.'
    )
  }

  room.players.set(player.id, {
    id: player.id,
    name: player.name,
    position: 0,
    connected: true,
  })

  room.wins.set(player.id, 0)
}

// RECONNECT PLAYER
export function reconnectPlayer(
  room,
  playerId,
  name
) {
  if (!room) {
    throw new Error('Room not found.')
  }

  const player = room.players.get(playerId)

  if (!player) {
    throw new Error(
      'Player was not found in this room.'
    )
  }

  player.connected = true

  if (name?.trim()) {
    player.name = name.trim()
  }
}

// DISCONNECT
export function disconnectPlayer(
  room,
  playerId
) {
  if (!room) return

  const player = room.players.get(playerId)

  if (player) {
    player.connected = false
  }
}

// REMOVE PLAYER
export function removePlayer(
  room,
  playerId
) {
  if (!room) return

  room.players.delete(playerId)

  // Delete empty room
  if (room.players.size === 0) {
    rooms.delete(room.roomId)
    return
  }

  // Give host role to another player
  if (room.host === playerId) {
    room.host = [...room.players.keys()][0]
  }

  // If current player leaves during game
  if (
    room.status === 'playing' &&
    room.currentTurn === playerId
  ) {
    const next = [
      ...room.players.values(),
    ].find(
      (player) => player.connected
    )

    room.currentTurn = next?.id ?? null
  }
}

// CLOSE ROOM
export function closeRoom(room, playerId) {
  if (!room) {
    throw new Error('Room not found.')
  }

  if (room.host !== playerId) {
    throw new Error('Only the host can close this room.')
  }

  rooms.delete(room.roomId)
}

// START GAME
export function startGame(
  room,
  playerId
) {
  if (!room) {
    throw new Error('Room not found.')
  }

  // Only host
  if (room.host !== playerId) {
    throw new Error(
      'Only the host can start the game.'
    )
  }

  // Minimum 2 players
  if (room.players.size < MIN_PLAYERS) {
    throw new Error(
      'At least 2 players are required.'
    )
  }

  // Don't allow more than selected number
  if (room.players.size > room.maxPlayers) {
    throw new Error(
      'Too many players in this room.'
    )
  }

  if (room.status !== 'waiting') {
    throw new Error(
      'Game has already started.'
    )
  }

  room.status = 'playing'

  room.winner = null

  room.lastMove = null

  // Reset all players
  for (const player of room.players.values()) {
    player.position = 0
  }

  // First player gets the turn
  room.currentTurn = [
    ...room.players.keys(),
  ][0]
}

// PLAY TURN
export function playTurn(
  room,
  playerId
) {
  if (!room) {
    throw new Error('Room not found.')
  }

  if (room.status !== 'playing') {
    throw new Error(
      'The game is not currently playing.'
    )
  }

  if (room.currentTurn !== playerId) {
    throw new Error(
      'It is not your turn.'
    )
  }

  const player = room.players.get(playerId)

  if (!player) {
    throw new Error(
      'Player not found.'
    )
  }

  const dice = rollDice()

  const result = movePlayer(
    player.position,
    dice
  )

  player.position = result.position

  let winner = null

  // WIN
  if (player.position === 100) {
    room.status = 'finished'

    room.winner = player.id

    winner = player

    room.wins.set(
      player.id,
      (room.wins.get(player.id) ?? 0) + 1,
    )
  }

  // NEXT TURN
  else {
    const players = [
      ...room.players.values(),
    ]

    const currentIndex =
      players.findIndex(
        (p) => p.id === playerId
      )

    let next = null

    for (
      let i = 1;
      i <= players.length;
      i++
    ) {
      const candidate =
        players[
          (currentIndex + i) %
            players.length
        ]

      if (candidate.connected) {
        next = candidate
        break
      }
    }

    room.currentTurn =
      next?.id ?? null
  }

  room.lastMove = {
    playerId,

    dice,

    message:
      `${player.name} rolled ${dice}. ` +
      `${result.message}`,

    timestamp: Date.now(),
  }

  return {
    dice,
    result,
    winner,
  }
}

// REMATCH
export function rematch(
  room,
  playerId
) {
  if (!room) {
    throw new Error('Room not found.')
  }

  if (room.status !== 'finished') {
    throw new Error(
      'The current game has not finished.'
    )
  }

  if (!room.players.has(playerId)) {
    throw new Error(
      'Player not found.'
    )
  }

  room.status = 'playing'

  room.winner = null

  room.lastMove = null

  // Reset positions
  for (const player of room.players.values()) {
    player.position = 0
  }

  // First connected player gets turn
  room.currentTurn =
    [
      ...room.players.values(),
    ].find(
      (player) => player.connected
    )?.id ?? null
}

// GET PUBLIC ROOM
export function getPublicRoom(room) {
  return publicRoom(room)
}

