console.log("hello!");

const canvas = document.getElementById('gameview') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', {alpha: false})!;
console.log("canvas size: ", canvas.width, canvas.height);

let x = 0;
let y = 0;
const timer = {
    dt: 0.001,
    time: 0,
    prev: performance.now()
};

function draw() {
    x += timer.dt;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, 10, 10);
}

function mainLoop(time: number) {
    const now = performance.now();
    timer.dt = (now - timer.prev) / 1000;
    timer.time += timer.dt;
    timer.prev = now;

    draw();
    requestAnimationFrame(mainLoop);
}

mainLoop(0);
