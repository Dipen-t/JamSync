import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// CORS configuration - update with your frontend URL in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.static("public"));

const PORT = process.env.PORT || 4000;

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    songs: songs.length,
    rooms: Object.keys(rooms).length
  });
});

// --- multer setup for uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueFilename = `${baseName}_${timestamp}${ext}`;
    cb(null, uniqueFilename);
  },
});
const upload = multer({ storage });

// --- rooms & songs storage ---
const rooms = {};
const roomUsers = {}; // Track users per room: { roomId: [{ socketId, joinTime }] }
let songs = [];

// Load existing songs from uploads directory on startup
const loadExistingSongs = () => {
  const uploadsDir = "public/uploads/";
  const songsDir = "public/songs/";
  
  // Load from uploads directory
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      if (file.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
        // Try to extract original name by removing timestamp pattern
        let displayName = file;
        const timestampMatch = file.match(/^(.+)_(\d+)\.(.+)$/);
        if (timestampMatch) {
          displayName = `${timestampMatch[1]}.${timestampMatch[3]}`;
        }
        
        const songId = uuidv4();
        songs.push({
          id: songId,
          title: displayName,
          url: `/uploads/${file}`,
        });
      }
    });
  }
  
  // Load from songs directory (default songs)
  if (fs.existsSync(songsDir)) {
    const files = fs.readdirSync(songsDir);
    files.forEach(file => {
      if (file.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
        const songId = uuidv4();
        songs.push({
          id: songId,
          title: file,
          url: `/songs/${file}`,
        });
      }
    });
  }
  
  console.log(`Loaded ${songs.length} existing songs from filesystem`);
};

// Load songs on startup
loadExistingSongs();

// --- Routes ---
app.get("/songs", (req, res) => res.json(songs));

app.post("/upload", upload.single("song"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const newSong = {
    id: uuidv4(),
    title: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
  };
  
  // Check for duplicates by URL only (URL is unique, title might not be)
  const existingSong = songs.find(s => s.url === newSong.url);
  if (existingSong) {
    // File already exists, return existing song info
    console.log(`Song already exists: ${newSong.title}, returning existing entry`);
    return res.json(existingSong);
  }
  
  // Add new song to global list
  songs.push(newSong);
  // Broadcast to all connected clients immediately
  io.emit("ADD_SONG", newSong);
  console.log(`New song added: ${newSong.title} (Total songs: ${songs.length})`);
  
  res.json(newSong);
});

// --- Socket.io ---
io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("CREATE_ROOM", () => {
    const roomId = uuidv4();
    rooms[roomId] = {
      hostId: socket.id,
      songId: songs.length > 0 ? songs[0].id : null,
      isPlaying: false,
      currentTime: 0,
      volume: 100,
      queue: songs.length > 0 ? [songs[0].id] : [],
      queuePosition: 0,
      updatedAt: Date.now(),
    };
    roomUsers[roomId] = [{ socketId: socket.id, joinTime: Date.now() }];
    socket.join(roomId);
    socket.emit("ROOM_CREATED", { roomId });
    // Always send complete song list
    socket.emit("SONG_LIST", songs);
    socket.emit("ROOM_SYNC", { ...rooms[roomId], users: roomUsers[roomId] });
    console.log(`Room created: ${roomId}, Songs available: ${songs.length}`);
  });

  socket.on("JOIN_ROOM", ({ roomId }) => {
    if (!roomId) {
      socket.emit("ROOM_ERROR", { error: "Invalid room ID" });
      return;
    }
    socket.join(roomId);
    const room = rooms[roomId];
    if (room) {
      // Add user to room
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }
      const userExists = roomUsers[roomId].some(u => u.socketId === socket.id);
      if (!userExists) {
        roomUsers[roomId].push({ socketId: socket.id, joinTime: Date.now() });
        // Notify others
        socket.to(roomId).emit("USER_JOINED", { socketId: socket.id, joinTime: Date.now() });
        // Log only for new users
        console.log(`User ${socket.id.substring(0, 8)} joined room: ${roomId.substring(0, 8)}..., Sent ${songs.length} songs`);
      }
      socket.emit("ROOM_SYNC", { ...room, users: roomUsers[roomId] || [] });
    } else {
      socket.emit("ROOM_ERROR", { error: "Room not found" });
      return;
    }
    // Always send complete song list to new users
    socket.emit("SONG_LIST", songs);
  });

  socket.on("HOST_PLAY", ({ roomId, time }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.isPlaying = true;
    room.currentTime = time;
    room.updatedAt = Date.now();
    io.to(roomId).emit("PLAY", { ...room, users: roomUsers[roomId] || [] });
  });

  socket.on("HOST_PAUSE", ({ roomId, time }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.isPlaying = false;
    room.currentTime = time;
    room.updatedAt = Date.now();
    io.to(roomId).emit("PAUSE", { ...room, users: roomUsers[roomId] || [] });
  });

  socket.on("CHANGE_SONG", ({ roomId, songId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.songId = songId;
    room.currentTime = 0;
    room.isPlaying = false;
    // Update queue position
    const queueIndex = room.queue.indexOf(songId);
    if (queueIndex !== -1) {
      room.queuePosition = queueIndex;
    }
    room.updatedAt = Date.now();
    io.to(roomId).emit("SONG_CHANGED", { ...room, users: roomUsers[roomId] || [] });
  });

  socket.on("HOST_VOLUME", ({ roomId, volume }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.volume = volume;
    room.updatedAt = Date.now();
    io.to(roomId).emit("VOLUME_CHANGED", { ...room, users: roomUsers[roomId] || [] });
  });

  socket.on("NEXT_SONG", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    if (room.queue.length > 0 && room.queuePosition < room.queue.length - 1) {
      room.queuePosition++;
      room.songId = room.queue[room.queuePosition];
      room.currentTime = 0;
      room.isPlaying = false;
      room.updatedAt = Date.now();
      io.to(roomId).emit("SONG_CHANGED", { ...room, users: roomUsers[roomId] || [] });
    }
  });

  socket.on("PREV_SONG", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    if (room.queue.length > 0 && room.queuePosition > 0) {
      room.queuePosition--;
      room.songId = room.queue[room.queuePosition];
      room.currentTime = 0;
      room.isPlaying = false;
      room.updatedAt = Date.now();
      io.to(roomId).emit("SONG_CHANGED", { ...room, users: roomUsers[roomId] || [] });
    }
  });

  socket.on("ADD_TO_QUEUE", ({ roomId, songId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (!room.queue.includes(songId)) {
      room.queue.push(songId);
      room.updatedAt = Date.now();
      io.to(roomId).emit("UPDATE_QUEUE", { ...room, users: roomUsers[roomId] || [] });
    }
  });

  socket.on("REORDER_QUEUE", ({ roomId, newQueue }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    room.queue = newQueue;
    // Update position if current song moved
    const newPosition = room.queue.indexOf(room.songId);
    if (newPosition !== -1) {
      room.queuePosition = newPosition;
    }
    room.updatedAt = Date.now();
    io.to(roomId).emit("UPDATE_QUEUE", { ...room, users: roomUsers[roomId] || [] });
  });

  socket.on("ADD_SONG", (song) => {
    // This is called when client uploads via the upload endpoint
    // The song is already added to the global list in the upload handler
    // Just broadcast to other clients
    socket.broadcast.emit("ADD_SONG", song);
  });

  socket.on("disconnect", () => {
    // Remove user from all rooms
    Object.keys(roomUsers).forEach(roomId => {
      const index = roomUsers[roomId].findIndex(u => u.socketId === socket.id);
      if (index !== -1) {
        roomUsers[roomId].splice(index, 1);
        // Notify others
        socket.to(roomId).emit("USER_LEFT", { socketId: socket.id });
        // If host left, room becomes invalid (could implement host transfer later)
        const room = rooms[roomId];
        if (room && room.hostId === socket.id) {
          // Host left - could transfer or close room
          delete rooms[roomId];
          delete roomUsers[roomId];
        }
      }
    });
  });
});

server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
