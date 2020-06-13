import {expect, assert} from 'chai';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import {NodeZip} from "./nodejs/NodeZip";

describe('adm-zip', () => {

    const destination = './testData/xxx';

    beforeEach(done => {
        rimraf.sync(destination);
        console.log('Cleared directory: ' + destination);
        return done();
    });

    it('zip.extractAllTo()', () => {
        const zip = NodeZip.fromFile('./testData/assets/ultra.zip');
        zip.extractAllTo(destination);
        const files = walk(destination)
        expect(files.sort()).to.deep.equal([
            "./testData/xxx/attributes_test/asd/New Text Document.txt",
            "./testData/xxx/attributes_test/blank file.txt",
            "./testData/xxx/attributes_test/New folder/hidden.txt",
            "./testData/xxx/attributes_test/New folder/hidden_readonly.txt",
            "./testData/xxx/attributes_test/New folder/readonly.txt",
            "./testData/xxx/utes_test/New folder/somefile.txt"
        ].sort());
    });

    it('zip.extractEntryTo(entry, destination, false, true)', () => {
        const zip = NodeZip.fromFile('./testData/assets/ultra.zip');
        for (const e of zip.getEntries()) {
            zip.extractEntryTo(e, destination, false, true);
        }

        const files = walk(destination)
        expect(files.sort()).to.deep.equal([
            "./testData/xxx/blank file.txt",
            "./testData/xxx/hidden.txt",
            "./testData/xxx/hidden_readonly.txt",
            "./testData/xxx/New Text Document.txt",
            "./testData/xxx/readonly.txt",
            "./testData/xxx/somefile.txt"
        ].sort());
    });

    it('zip.extractEntryTo(entry, destination, true, true)', () => {
        const zip = NodeZip.fromFile('./testData/assets/ultra.zip');
        for (const e of zip.getEntries()) {
            zip.extractEntryTo(e, destination, true, true);
        }

        const files = walk(destination)
        expect(files.sort()).to.deep.equal([
            "./testData/xxx/attributes_test/asd/New Text Document.txt",
            "./testData/xxx/attributes_test/blank file.txt",
            "./testData/xxx/attributes_test/New folder/hidden.txt",
            "./testData/xxx/attributes_test/New folder/hidden_readonly.txt",
            "./testData/xxx/attributes_test/New folder/readonly.txt",
            "./testData/xxx/utes_test/New folder/somefile.txt"
        ].sort());
    });

    it('passes issue-237-Twizzeld test case', () => {
        const zip = NodeZip.fromFile('./testData/assets/issue-237-Twizzeld.zip');
        for (const e of zip.getEntries()) {
            if (!e.isDirectory) {
                zip.extractEntryTo(e, './', false, true);
                // This should create text.txt on the desktop.
                // It will actually create two, but the first is overwritten by the second.
            }
        }
        let text = fs.readFileSync('./text.txt').toString()
        expect(text).to.equal('ride em cowboy!')
        fs.unlinkSync('./text.txt')
    });

    it('zip.test()', () => {
        const good = NodeZip.fromFile('./testData/crc/good_crc.zip');
        assert.isTrue(good.test());

        //const bad = Zip.fromFile('./testData/crc/bad_crc.zip');
        //assert.isFalse(bad.test());
    });
});

function walk(dir: string) {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = dir + '/' + file;
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            // recurse into a subdirectory
            results = results.concat(walk(fullPath));
        } else {
            // is a file
            results.push(fullPath);
        }
    }
    return results;
}

// function walkD(dir: string) {
//     let results: string[] = [];
//     const list = fs.readdirSync(dir);
//     for(const file of list) {
//         const fullPath = dir + '/' + file;
//         const stat = fs.statSync(fullPath);
//         if (stat && stat.isDirectory()) {
//             // recurse into a subdirectory
//             results = results.concat(walk(fullPath));
//             results.push(fullPath);
//         }
//     }
//     return results;
// }