import {PackerState, packNodes} from "@highduck/binpack";

const names = [
    "any",
    "best area fit",
    "contact point",
    "bottom-left",
    "best long-side fit",
    "best short-side fit",
];

const packerStats = {
    w: 0,
    h: 0,
    bw: 0,
    bh: 0,
    method: 0,
    time: 0,
    flip: true
};
const packer = new PackerState();
for (let i = 0; i < 150; ++i) {
    packer.add(
        Math.round(5 + 0.75 * i * Math.random()),
        Math.round(5 + 0.75 * i * Math.random()),
        1,
        undefined
    );
}

function pack() {
    const ts = performance.now();
    // packerStats.method = 2;
    packNodes(packer, packerStats.method, packerStats.flip);
    packerStats.time = performance.now() - ts;
    packerStats.w = packer.w;
    packerStats.h = packer.h;
    packerStats.bw = 0;
    packerStats.bh = 0;
    for (let i = 0; i < packer.rects.length; ++i) {
        const rc = packer.rects[i];
        let r = rc.x + rc.w;
        let b = rc.y + rc.h;
        if (packer.isRotated(i)) {
            r = rc.x + rc.h;
            b = rc.y + rc.w;
        }

        if (r > packerStats.bw) {
            packerStats.bw = r;
        }
        if (b > packerStats.bh) {
            packerStats.bh = b;
        }
    }

    console.log(`${packerStats.bw}x${packerStats.bh} : ${packerStats.flip} ${names[packerStats.method]}`);
}

pack();

setInterval(() => {
    ++packerStats.method;
    if (packerStats.method >= names.length) {
        packerStats.method = 0;
        packerStats.flip = !packerStats.flip;
    }
    pack();
}, 1500);

const canvas = document.getElementById('gameview') as HTMLCanvasElement;
canvas.width = 2048;
canvas.height = 2048;
const dpr = window.devicePixelRatio;
canvas.style.width = `${canvas.width / dpr}px`;
canvas.style.height = `${canvas.height / dpr}px`;

const ctx = canvas.getContext('2d', {alpha: false})!;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000';

    ctx.beginPath();
    ctx.rect(0, 0, packer.w, packer.h);
    ctx.closePath();
    ctx.fillStyle = '#8B8';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(0, 0, packerStats.bw, packerStats.bh);
    ctx.closePath();
    ctx.fillStyle = '#999';
    ctx.fill();

    const pp = 2;
    const pp2 = pp << 1;
    for (let idx = 0; idx < packer.rects.length; ++idx) {
        if (packer.isPacked(idx)) {
            const rc = packer.rects[idx];
            if (!packer.isRotated(idx)) {
                ctx.beginPath();
                ctx.rect(rc.x + pp, rc.y + pp, rc.w - pp2, rc.h - pp2);
                ctx.closePath();

                ctx.fillStyle = '#393';
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(rc.x + rc.w * 0.5, rc.y);
                ctx.lineTo(rc.x + rc.w * 0.5, rc.y + rc.h * 0.5);
                ctx.closePath();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.rect(rc.x + pp, rc.y + pp, rc.h - pp2, rc.w - pp2);
                ctx.closePath();

                ctx.fillStyle = '#993';
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(rc.x, rc.y + rc.w * 0.5);
                ctx.lineTo(rc.x + rc.h * 0.5, rc.y + rc.w * 0.5);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }

    ctx.font = 'bold 38px arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`Method #${packerStats.method}: ${names[packerStats.method]}`, 10, packer.h + 40);
    ctx.fillText(`Allow Flip: ${packerStats.flip}`, 10, packer.h + 80);
    ctx.fillText(`Fill: ${100 * packerStats.w * packerStats.h / (packerStats.bw * packerStats.bh)}`, 10, packer.h + 120);
    ctx.fillText(`Time: ${packerStats.time} ms`, 10, packer.h + 160);
}

function mainLoop(time: number) {
    draw();
    requestAnimationFrame(mainLoop);
}

mainLoop(0);
