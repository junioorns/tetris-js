"use strict";

const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

let dropInterval = level();
let isGameRunning = false;


context.scale(20, 20);

function level(){
    const selectElement = document.getElementById("level");
    const selectValue = selectElement.value;

    if(selectValue === "hard"){
        return 60;
    } else if(selectValue === "normal"){
        return 120;
    }else if(selectValue === "easy"){
        return 250;
    }else {
        return 0; 
    }
}

function createMatrix(w, h){
    const matrix = [];
    while(h--){
        matrix.push(new Array(w).fill(0))
    }
    return matrix;
}

function createPiece(type) {
    if (type === "I") {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ];
    } else if (type === "L") {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2]
        ];
    } else if (type === "O") {
        return [
            [4, 4],
            [4, 4]
        ];
    } else if (type === "J") {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0]
        ];
    } else if (type === "T") {
        return [
            [7, 7, 7],
            [0, 7, 0],
            [0, 0, 0]
        ];
    } else if (type === "Z") {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0]
        ];
    } else if (type === "S") {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]
        ];
    }
}


function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const color = colors[value];
                context.fillStyle = color;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.lineJoin = "round";

                context.strokeStyle = "black";
                context.lineWidth = 0.1;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}


function merge(arena, player){
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        })
    })
}


function rotate(matrix, dir) {
    const N = matrix.length;
    const rotatedMatrix = new Array(N).fill(0).map(() => new Array(N).fill(0));

    if (dir === 1) {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                rotatedMatrix[i][j] = matrix[N - j - 1][i];
            }
        }
    } else if (dir === -1) {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                rotatedMatrix[i][j] = matrix[j][N - i - 1];
            }
        }
    }

  
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            matrix[i][j] = rotatedMatrix[i][j];
        }
    }
}


function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

const colors = [
    null,
    "#ff0d72",
    "#0dc2ff",
    "#0dff72",
    "#f538ff",
    "#ff8e0d",
    "#ffe138",
    "#3877ff",
];

const arena = createMatrix(12, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

let dropCounter = 0;

let lastTime = 0;

let isPaused = false;
let animationId;

function startGame(){
    if(!isGameRunning){
        playerReset();
        updateScore();
        update();
        pauseButton.disabled = false;
        startButton.innerHTML = "Restart";
        isGameRunning = true;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    arena.forEach((row) => row.fill(0));
    dropInterval = level();
}

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startGame);

function pauseGame(){
    isPaused = !isPaused;
    if(isPaused){
        cancelAnimationFrame(animationId);
        pauseButton.innerText = "Resume";
    }else {
        update();
        pauseButton.innerText = "Pause";
    }
}

const pauseButton = document.getElementById("pauseButton");
pauseButton.addEventListener("click", pauseGame);

const stopButton = document.getElementById("stopButton");
stopButton.addEventListener("click", stopGame);

function stopGame(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    arena.forEach((row) => row.fill(0));
    playerReset();
    player.score = 0;
    updateScore();

    pauseButton.disabled = true;
    isGameRunning = false;

    startButton.innerHTML = "Start Game";
    pauseButton.innerHTML = "Pause";
    pauseButton.disabled = true;
    isPaused = false;

    cancelAnimationFrame(animationId);
}

function playerReset() {
    const pieces = "ITJLOSZ";
    player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    if (collide(arena, player)) {
        arena.forEach((row) => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function updateScore() {
    document.getElementById("score").innerText = "Score: " + player.score;
}

document.addEventListener("keydown", (event) => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    }
});


function update(time = 0) {
    if (!isPaused) {
        const deltaTime = time - lastTime;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        lastTime = time;
        draw();
    }

    animationId = requestAnimationFrame(update);
}


function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}


function playerDrop() {
    
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        if (player.pos.y <= 1) {
            gameOver();
            return;
        }
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}



function gameOver() {
    stopGame();
    alert('Game Over! Your score: ' + player.score);
    location.reload();


    setTimeout(function() {
    location.reload();
    }, 1000)
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}


function draw() {
    context.fillStyle = "#F5F5F5";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);

}