import * as path from 'path';
import * as rimraf from 'rimraf';
import {assert} from 'chai';
import {NodeZip} from "./nodejs/NodeZip";

describe('crc', () => {
    const destination = './testData/xxx';

    beforeEach((done) => {
        rimraf.sync(destination);
        done();
    });

    const sourceDir = './testData/crc';
    it('Good CRC', async () => {
        const goodZip = NodeZip.fromFile(path.join(sourceDir, 'good_crc.zip'));
        const entries = goodZip.getEntries();
        assert.equal(entries.length, 1, 'Good CRC: Test archive contains exactly 1 file');

        const testFile = entries.filter(function (entry) {
            return entry.entryName === 'lorem_ipsum.txt';
        });
        assert.equal(testFile.length, 1, 'Good CRC: lorem_ipsum.txt file exists as archive entry');

        const testFileEntryName = testFile[0].entryName;
        const data = await goodZip.readAsTextAsync(testFileEntryName);
        assert.isNotEmpty(data, 'Good CRC: buffer not empty');
        return;
    });

    it('Bad CRC', async () => {
        const badZip = NodeZip.fromFile(path.join(sourceDir, 'bad_crc.zip'));
        const entries = badZip.getEntries();
        assert.equal(entries.length, 1, 'Bad CRC: Test archive contains exactly 1 file');

        const testFile = entries.filter(function (entry) {
            return entry.entryName === 'lorem_ipsum.txt';
        });
        assert.equal(testFile.length, 1, 'Bad CRC: lorem_ipsum.txt file exists as archive entry');

        const testFileEntryName = testFile[0].entryName;
        // TODO: how to report CRC check error?
        let catchError: Error | undefined = undefined;
        try {
            const data = await badZip.readAsTextAsync(testFileEntryName);
            //console.log(data);
            assert.isNotEmpty(data, 'Bad CRC: buffer is not empty');
        } catch (err) {
            catchError = err;
        }
        //assert.isDefined(catchedError, 'Bad CRC: error object present');
        return;
    });

    it('CRC is not changed after re-created', () => {
        const goodZip = NodeZip.fromFile(path.join(sourceDir, 'good_crc.zip'));
        const original = goodZip.getEntries()[0].entryHeader.crc;
        assert.equal(original, 3528145192);
        const newZipPath = destination + '/good_crc_new.zip';
        goodZip.writeZip(newZipPath);
        const newZip = NodeZip.fromFile(newZipPath);
        const actual = newZip.getEntries()[0].entryHeader.crc;
        assert.equal(actual, original);
    });
});
