const socket = io();

let me = null;
let gameFull = false;

let experienceState = {
  users: {},
  board: Array(9).fill(null),
  turn: null,
  winner: null
};

const GRID_SIZE = 3;

let restartBtn = {
  x: null,
  y: null,
  w: 100,
  h: 30
};



function setup() {
  // Make canvas square and fill 90% of screen
  const size = min(windowWidth, windowHeight) * 0.9;
  createCanvas(size, size);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(255, 0, 0);

  if (gameFull) {
    textSize(24);
    text("Game already has 2 players", width / 2, height / 2);
    return;
  }

  drawGrid();
  drawBoard();
  drawStatus();
}

function drawGrid() {
  stroke(0);
  strokeWeight(5);
  fill(50);
  let cellW = width / GRID_SIZE;
  let cellH = height / GRID_SIZE;

  for (let i = 1; i < GRID_SIZE; i++) {
    line(i * cellW, 0, i * cellW, height);
    line(0, i * cellH, width, i * cellH);
  }
}

function drawBoard() {
  stroke(255);
  strokeWeight(5);
  fill(255); 
  textSize(64);

  let cellW = width / GRID_SIZE;
  let cellH = height / GRID_SIZE;

  for (let i = 0; i < experienceState.board.length; i++) {
    let col = i % GRID_SIZE;
    let row = floor(i / GRID_SIZE);

    let x = col * cellW + cellW / 2;
    let y = row * cellH + cellH / 2;

    if (experienceState.board[i]) {
      text(experienceState.board[i], x, y);
    }
  }
}

function drawStatus() {
  textSize(20);
  fill(0);

  if (experienceState.winner) {
    if (experienceState.winner === "draw") {
      text("Draw!", width / 2, height - 60);
    } else if (experienceState.winner === me) {
      text("You win!", width / 2, height - 60);
    } else {
      text("You lose!", width / 2, height - 60);
    }

    drawRestartButton();

  } else if (experienceState.turn === me) {
    text("Your turn", width / 2, height - 20);
  } else {
    text("Opponent's turn", width / 2, height - 20);
  }
}

function drawRestartButton() {
  restartBtn.x = width / 2;
  restartBtn.y = height - 30; 

  rectMode(CENTER);
  fill(220);
  stroke(0);
  rect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h);

  noStroke();
  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("Restart", restartBtn.x, restartBtn.y);
}



function mousePressed() {

  // Restart button
  if (experienceState.winner) {
    if (
      mouseX > restartBtn.x - restartBtn.w / 2 &&
      mouseX < restartBtn.x + restartBtn.w / 2 &&
      mouseY > restartBtn.y - restartBtn.h / 2 &&
      mouseY < restartBtn.y + restartBtn.h / 2
    )     {
      socket.emit("restart");
}

  }

  // Make move
  if (experienceState.turn !== me) return;
  if (experienceState.winner) return;

  let col = floor(mouseX / (width / GRID_SIZE));
  let row = floor(mouseY / (height / GRID_SIZE));

  if (col < 0 || col > 2 || row < 0 || row > 2) return;

  let index = row * GRID_SIZE + col;
  if (experienceState.board[index] !== null) return;

  socket.emit("move", index);
}

function touchStarted() {
  mousePressed();
  return false; // prevent scrolling
}

function windowResized() {
  const size = min(windowWidth, windowHeight) * 0.9; // 90% of screen
  resizeCanvas(size, size);
}


// ----------------------------
// SOCKET EVENTS
// ----------------------------
socket.on("state", (state) => {
  experienceState = state;
});

socket.on("full", () => {
  gameFull = true;
});

socket.on("connect", () => {
  me = socket.id;
});


