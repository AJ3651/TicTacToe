import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 4000;

app.use(express.static("public"));

server.listen(port, () => {
  console.log("Listening on http://localhost:" + port);
});

// ----------------------------
// GAME STATE (SERVER AUTHORITY)
// ----------------------------
const GRID_SIZE = 3;

let experienceState = {
  users: {},                // socket.id -> { symbol: "X" | "O" }
  board: Array(9).fill(null),
  turn: null,               // socket.id
  winner: null              // socket.id | "draw" | null
};

// ----------------------------
// SOCKET CONNECTION
// ----------------------------
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  const currentUsers = Object.keys(experienceState.users);

  // Only allow 2 players
  if (currentUsers.length >= 2) {
    socket.emit("full");
    return;
  }

  socket.join("gameRoom");

  // Assign symbol if user is new
  if (!experienceState.users[socket.id]) {
    const assignedSymbols = Object.values(experienceState.users).map(u => u.symbol);
    const symbol = assignedSymbols.includes("X") ? "O" : "X";
    experienceState.users[socket.id] = { symbol };
  }

  // Set turn if it's null
  if (!experienceState.turn) {
    experienceState.turn = socket.id;
  }

  // Send current state to all players
  io.to("gameRoom").emit("state", experienceState);

  // ----------------------------
  // HANDLE MOVE
  // ----------------------------
  socket.on("move", (index) => {
    if (experienceState.winner) return;
    if (experienceState.turn !== socket.id) return;
    if (experienceState.board[index] !== null) return;

    experienceState.board[index] = experienceState.users[socket.id].symbol;

    const result = checkWinner(experienceState.board);

    if (result) {
      experienceState.winner =
        result === "draw" ? "draw" : getPlayerBySymbol(result);
    } else {
      experienceState.turn = getOtherPlayer(socket.id);
    }

    io.to("gameRoom").emit("state", experienceState);
  });

  // ----------------------------
  // RESTART GAME
  // ----------------------------
  socket.on("restart", () => {
    if (!experienceState.winner) return;

    experienceState.board = Array(9).fill(null);
    experienceState.winner = null;

    const players = Object.keys(experienceState.users);
    experienceState.turn = players[0] || null;

    io.to("gameRoom").emit("state", experienceState);
  });

  // ----------------------------
  // DISCONNECT
  // ----------------------------
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    delete experienceState.users[socket.id];

    // Only reset board if no players remain
    if (Object.keys(experienceState.users).length === 0) {
      experienceState.board = Array(9).fill(null);
      experienceState.turn = null;
      experienceState.winner = null;
    } else {
      // If someone remains, set turn to a remaining player
      const remaining = Object.keys(experienceState.users);
      experienceState.turn = remaining[0];
    }

    io.to("gameRoom").emit("state", experienceState);
  });
});

// ----------------------------
// HELPER FUNCTIONS
// ----------------------------
function getOtherPlayer(id) {
  return Object.keys(experienceState.users).find(uid => uid !== id);
}

function getPlayerBySymbol(symbol) {
  return Object.keys(experienceState.users).find(
    id => experienceState.users[id].symbol === symbol
  );
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) {
    return "draw";
  }

  return null;
}
