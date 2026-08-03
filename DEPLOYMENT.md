# Deployment notes

## Backend

Deploy the `server` directory to a Node.js hosting provider.

Build command:
```bash
npm install
```

Start command:
```bash
npm start
```

Environment:
```env
PORT=5000
CLIENT_URL=https://YOUR-FRONTEND-DOMAIN
```

The provider must support WebSockets / Socket.IO.

## Frontend

Deploy the `client` directory as a Vite/React application.

Build:
```bash
npm install
npm run build
```

Environment:
```env
VITE_SERVER_URL=https://YOUR-BACKEND-DOMAIN
```

Important: `VITE_SERVER_URL` must point to the backend, not the frontend.

## Important production considerations

This starter stores active rooms in server memory. That is ideal for an MVP/single-server deployment. For multiple backend instances, use a shared Socket.IO adapter (such as Redis) and a persistent room/game store.

For a public release, add:
- authentication
- rate limiting
- room expiration
- server-side input validation
- abuse protection
- persistent game history
- Redis adapter for horizontal scaling
