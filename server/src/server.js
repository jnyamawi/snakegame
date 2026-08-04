import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'

import {
  createRoom,
  getRoom,
  addPlayer,
  reconnectPlayer,
  disconnectPlayer,
  removePlayer,
  closeRoom,
  startGame,
  playTurn,
  rematch,
  getPublicRoom,
} from './game/roomManager.js'

const app = express()

const server = http.createServer(app)

const PORT = Number(
  process.env.PORT || 5000
)

const CLIENT_URL =
  process.env.CLIENT_URL ||
  'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_URL,
  })
)

app.use(express.json())

// HEALTH CHECK
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'snake-ladder-server',
  })
})

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
})

// SEND ROOM STATE
function emitRoom(room) {
  if (!room) return

  io.to(room.roomId).emit(
    'room-state',
    getPublicRoom(room)
  )
}

// SEND ERROR
function sendError(
  socket,
  message
) {
  socket.emit(
    'room-error',
    {
      message,
    }
  )
}

io.on('connection', (socket) => {

  console.log(
    `Player connected: ${socket.id}`
  )

  // =====================================================
  // CREATE ROOM
  // =====================================================

  socket.on(
    'create-room',
    ({ name, maxPlayers }) => {

      try {

        if (!name?.trim()) {
          throw new Error(
            'Player name is required.'
          )
        }

        // Validate player count
        const selectedPlayers =
          Number(maxPlayers)

        if (
          !Number.isInteger(
            selectedPlayers
          ) ||
          selectedPlayers < 2 ||
          selectedPlayers > 4
        ) {
          throw new Error(
            'Choose between 2 and 4 players.'
          )
        }

        const player = {
          id: socket.id,

          name: name
            .trim()
            .slice(0, 18),
        }

        // Create room with selected limit
        const room = createRoom(
          player,
          selectedPlayers
        )

        // Join Socket.IO room
        socket.join(room.roomId)

        socket.data.roomId =
          room.roomId

        socket.data.playerId =
          player.id

        // Tell creator room was created
        socket.emit(
          'room-created',
          {
            roomId: room.roomId,
            playerId: player.id,
          }
        )

        // Send room state
        emitRoom(room)

        console.log(
          `Room ${room.roomId} created by ${player.name} - Max players: ${selectedPlayers}`
        )

      } catch (e) {

        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // JOIN ROOM
  // =====================================================

  socket.on(
    'join-room',
    ({ roomId, name }) => {

      try {

        if (!name?.trim()) {
          throw new Error(
            'Player name is required.'
          )
        }

        const cleanRoomId =
          roomId
            ?.trim()
            .toUpperCase()

        const room =
          getRoom(cleanRoomId)

        if (!room) {
          throw new Error(
            'Room not found. Check the Room ID.'
          )
        }

        const player = {
          id: socket.id,

          name: name
            .trim()
            .slice(0, 18),
        }

        // This function now checks
        // the room's maxPlayers
        addPlayer(
          room,
          player
        )

        socket.join(
          room.roomId
        )

        socket.data.roomId =
          room.roomId

        socket.data.playerId =
          player.id

        socket.emit(
          'room-joined',
          {
            roomId: room.roomId,
            playerId: player.id,
          }
        )

        emitRoom(room)

        console.log(
          `${player.name} joined ${room.roomId}`
        )

      } catch (e) {

        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // REJOIN ROOM
  // =====================================================

  socket.on(
    'rejoin-room',
    ({
      roomId,
      playerId,
      name,
    }) => {

      try {

        const room =
          getRoom(
            roomId
              ?.trim()
              .toUpperCase()
          )

        if (!room) {
          throw new Error(
            'Room no longer exists.'
          )
        }

        reconnectPlayer(
          room,
          playerId,
          name
        )

        socket.join(
          room.roomId
        )

        socket.data.roomId =
          room.roomId

        socket.data.playerId =
          playerId

        emitRoom(room)

      } catch (e) {

        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // START GAME
  // =====================================================

  socket.on(
    'start-game',
    ({
      roomId,
      playerId,
    }) => {

      try {

        const room =
          getRoom(roomId)

        startGame(
          room,
          playerId
        )

        emitRoom(room)

        io.to(
          room.roomId
        ).emit(
          'game-started'
        )

      } catch (e) {

        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // ROLL DICE
  // =====================================================

  socket.on(
    'roll-dice',
    ({
      roomId,
      playerId,
    }) => {

      try {

        const room =
          getRoom(roomId)

        const {
          dice,
          winner,
        } = playTurn(
          room,
          playerId
        )

        io.to(
          room.roomId
        ).emit(
          'game-event',
          {
            playerId,

            dice,

            message:
              room.lastMove
                .message,

            winner:
              winner?.id ?? null,
          }
        )

        emitRoom(room)

      } catch (e) {

        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // REMATCH
  // =====================================================

  socket.on(
    'rematch',
    ({
      roomId,
      playerId,
    }) => {

      try {

        const room =
          getRoom(roomId)

        rematch(
          room,
          playerId
        )

        io.to(
          room.roomId
        ).emit(
          'game-event',
          {
            message:
              '🔄 New game started!',
          }
        )

        emitRoom(room)

      } catch (e) {

        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // CLOSE ROOM
  // =====================================================

  socket.on(
    'close-room',
    ({
      roomId,
      playerId,
    }) => {

      try {
        const room = getRoom(roomId)

        closeRoom(room, playerId)

        io.to(room.roomId).emit(
          'room-closed',
          {
            roomId: room.roomId,
            message: 'Host has closed the room.',
          }
        )
      } catch (e) {
        sendError(
          socket,
          e.message
        )
      }
    }
  )

  // =====================================================
  // LEAVE ROOM
  // =====================================================

  socket.on(
    'leave-room',
    ({
      roomId,
      playerId,
    }) => {

      const room =
        getRoom(roomId)

      if (!room) return

      removePlayer(
        room,
        playerId
      )

      socket.leave(roomId)

      socket.data.roomId =
        null

      socket.data.playerId =
        null

      emitRoom(room)
    }
  )

  // =====================================================
  // DISCONNECT
  // =====================================================

  socket.on(
    'disconnect',
    () => {

      console.log(
        `Player disconnected: ${socket.id}`
      )

      const roomId =
        socket.data.roomId

      const playerId =
        socket.data.playerId

      if (
        !roomId ||
        !playerId
      ) {
        return
      }

      const room =
        getRoom(roomId)

      if (!room) return

      // Mark player disconnected
      // instead of immediately deleting them
      disconnectPlayer(
        room,
        playerId
      )

      emitRoom(room)
    }
  )
})

// =====================================================
// START SERVER
// =====================================================

server.listen(
  PORT,
  () => {

    console.log(
      `Snake & Ladder server running on http://localhost:${PORT}`
    )

  }
)

