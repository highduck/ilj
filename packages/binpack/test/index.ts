import {PackerState, packNodes} from "@highduck/binpack";

const packer = new PackerState();
const padding = 2;
const width = 1000;
const height = 20;

packer.add(width, height, padding, {myData: true});

const result = packNodes(packer);

let oks = 0;
let failures = 0;

function assertThat(cond: boolean) {
    if (cond) {
        ++oks;
    } else {
        ++failures;
    }
}

assertThat(result);
assertThat(packer.rects.length === 1);
const rc = packer.rects[0];
assertThat(rc.x === 0 && rc.y === 0);
assertThat(rc.w === width + padding * 2);
assertThat(rc.h === height + padding * 2);
assertThat(!packer.isRotated(0));
assertThat(packer.userData[0].myData);
assertThat(packer.w === 1024);
assertThat(packer.h === 512);

console.info("OK: " + oks);
console.error("FAILURES: " + failures);
if (failures > 0) {
    process.exit(1);
}