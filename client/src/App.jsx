import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<Lobby />} />
      <Route path="/room/:roomId/game" element={<Game />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}