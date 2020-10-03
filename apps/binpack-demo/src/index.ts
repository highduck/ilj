import { InputOptions, InputRect, Method, pack, PackResult } from '@highduck/binpack';

const names = [
  'any',
  'best area fit',
  'contact point',
  'bottom-left',
  'best long-side fit',
  'best short-side fit',
];

const packerStats = {
  w: 0,
  h: 0,
  bw: 0,
  bh: 0,
  method: 0,
  time: 0,
  flip: true,
};

const inputOptions: InputOptions = {
  maxWidth: 512,
  maxHeight: 512,
  method: Method.All,
  rotate: true,
};

const inputRects: InputRect[] = [];

let packerOutput: PackResult = {
  pages: [],
  notPacked: [],
  rotate: false,
  method: Method.All,
};

for (let i = 0; i < 250; ++i) {
  inputRects.push({
    w: Math.round(5 + 0.75 * i * Math.random()),
    h: Math.round(5 + 0.75 * i * Math.random()),
    padding: 1,
  });
}

function dopack() {
  const ts = performance.now();
  // packerStats.method = 2;
  inputOptions.method = packerStats.method;
  inputOptions.rotate = packerStats.flip;
  packerOutput = pack(inputRects, inputOptions);
  packerStats.time = performance.now() - ts;
  const page = packerOutput.pages[0];
  packerStats.w = page.w;
  packerStats.h = page.h;
  packerStats.bw = 0;
  packerStats.bh = 0;
  for (let i = 0; i < page.rects.length; ++i) {
    const rc = page.rects[i];
    let r = rc.x + rc.w;
    let b = rc.y + rc.h;
    if (rc.rotated) {
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

  console.log(
    `${packerStats.bw}x${packerStats.bh} : ${packerStats.flip} ${names[packerStats.method]}`,
  );
}

dopack();

const btn = document.createElement('button');
btn.onclick = () => {
  ++packerStats.method;
  if (packerStats.method >= names.length) {
    packerStats.method = 0;
    packerStats.flip = !packerStats.flip;
  }
  dopack();
};
document.body.appendChild(btn);
// setInterval(, 1500);

const canvas = document.getElementById('gameview') as HTMLCanvasElement;
canvas.width = 2048;
canvas.height = 2048;
const dpr = window.devicePixelRatio;
canvas.style.width = `${canvas.width / dpr}px`;
canvas.style.height = `${canvas.height / dpr}px`;

const ctx = canvas.getContext('2d', { alpha: false })!;

function draw() {
  ctx.resetTransform();
  ctx.fillStyle = '#FFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const page of packerOutput.pages) {
    ctx.strokeStyle = '#000';

    ctx.beginPath();
    ctx.rect(0, 0, page.w, page.h);
    ctx.closePath();
    ctx.fillStyle = '#8B8';
    ctx.fill();
    ctx.stroke();

    for (const rc of page.rects) {
      if (!rc.rotated) {
        ctx.beginPath();
        ctx.rect(rc.x, rc.y, rc.w, rc.h);
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
        ctx.rect(rc.x, rc.y, rc.h, rc.w);
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

    ctx.font = 'bold 38px arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`Method #${packerStats.method}: ${names[packerStats.method]}`, 10, page.h + 40);
    ctx.fillText(`Allow Flip: ${packerStats.flip}`, 10, page.h + 80);
    ctx.fillText(
      `Fill: ${(100 * packerStats.w * packerStats.h) / (packerStats.bw * packerStats.bh)}`,
      10,
      page.h + 120,
    );
    ctx.fillText(`Time: ${packerStats.time} ms`, 10, page.h + 160);
    ctx.fillText(`Page: ${page.method} ${page.rects.length}`, 10, page.h + 220);

    ctx.translate(page.w + 10, 0);
  }
}

function mainLoop(time: number) {
  draw();
  requestAnimationFrame(mainLoop);
}

mainLoop(0);
