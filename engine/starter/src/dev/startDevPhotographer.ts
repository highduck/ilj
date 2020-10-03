export function startDevPhotographer(canvas: HTMLCanvasElement) {
    let index = 0;

    setInterval(() => {
        canvas.toBlob((blob) => {
            if (!blob) {
                console.warn("bad blob");
            } else {
                const name = `screen_${index}.png`;
                console.log("blob created ", name);

                const data = new FormData();
                data.append('file', blob, name);

                const request = new XMLHttpRequest();
                request.open("POST", "http://localhost:8081/save/");
                request.send(data);
            }
        });
        ++index;
    }, 1000);
}