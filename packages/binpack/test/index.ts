import {Method, pack} from "@highduck/binpack";

const padding = 2;
const border = 0;
const width = 1000;
const height = 20;

const result = pack([{
    w: width,
    h: height,
    padding,
    data: {myData: true}
}], {
    maxWidth: 2048,
    maxHeight: 2048
});

let oks = 0;
let failures = 0;

function assertThat(cond: boolean) {
    if (cond) {
        ++oks;
    } else {
        ++failures;
        throw new Error("fail");
    }
}

assertThat(result.pages.length === 1);
assertThat(result.notPacked.length === 0);

// rotate should be passed from input
assertThat(result.rotate);

assertThat(result.method === Method.All);

const page = result.pages[0];
assertThat(page.w === 1024);
assertThat(page.h === 512);

// selected method should be specific
assertThat(page.method !== Method.All);

const rc = page.rects[0];
assertThat(rc.x === padding + border);
assertThat(rc.y === padding + border);
assertThat(rc.w === width);
assertThat(rc.h === height);
assertThat(!rc.rotated);
assertThat(rc.data !== undefined);
assertThat(rc.data.myData);

console.info("OK: " + oks);
if (failures > 0) {
    console.warn("FAILURES: " + failures);
    process.exit(1);
}