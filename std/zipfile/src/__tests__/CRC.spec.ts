import * as path from 'path';
import * as rimraf from 'rimraf';
import { NodeZip } from '../nodejs/NodeZip';
import * as fs from 'fs';

describe('crc', () => {
  let basedir = './packages/zipfile/testData';
  if (!fs.existsSync(basedir)) {
    basedir = './testData';
  }
  const destination = path.join(basedir, 'temp-crc');
  const sourceDir = path.join(basedir, 'crc');

  beforeEach(async () => {
    rimraf.sync(destination);
  });

  it('Good CRC', async () => {
    const goodZip = NodeZip.fromFile(path.join(sourceDir, 'good_crc.zip'));
    const entries = goodZip.getEntries();
    // , 'Good CRC: Test archive contains exactly 1 file')
    expect(entries).toHaveLength(1);

    const testFile = entries.filter(function (entry) {
      return entry.entryName === 'lorem_ipsum.txt';
    });
    // , 'Good CRC: lorem_ipsum.txt file exists as archive entry');
    expect(testFile).toHaveLength(1);

    const testFileEntryName = testFile[0].entryName;
    const data = await goodZip.readAsTextAsync(testFileEntryName);
    // Good CRC: buffer not empty
    expect(data.length).toBeGreaterThan(0);
  });

  it('Bad CRC', async () => {
    const badZip = NodeZip.fromFile(path.join(sourceDir, 'bad_crc.zip'));
    const entries = badZip.getEntries();
    // , 'Bad CRC: Test archive contains exactly 1 file');
    expect(entries).toHaveLength(1);

    const testFile = entries.filter(function (entry) {
      return entry.entryName === 'lorem_ipsum.txt';
    });
    // , 'Bad CRC: lorem_ipsum.txt file exists as archive entry');
    expect(testFile).toHaveLength(1);

    const testFileEntryName = testFile[0].entryName;
    // TODO: how to report CRC check error?
    let catchError: Error | undefined = undefined;
    try {
      const data = await badZip.readAsTextAsync(testFileEntryName);
      // , 'Bad CRC: buffer is not empty');
      expect(data.length).toBeGreaterThan(0);
    } catch (err) {
      catchError = err;
    }
    //assert.isDefined(catchedError, 'Bad CRC: error object present');
  });

  it('CRC is not changed after re-created', () => {
    const goodZip = NodeZip.fromFile(path.join(sourceDir, 'good_crc.zip'));
    const original = goodZip.getEntries()[0].entryHeader.crc;
    expect(original).toStrictEqual(3528145192);
    const newZipPath = path.join(destination, 'good_crc_new.zip');
    fs.mkdirSync(destination);
    goodZip.writeZip(newZipPath);
    const newZip = NodeZip.fromFile(newZipPath);
    const actual = newZip.getEntries()[0].entryHeader.crc;
    expect(actual).toStrictEqual(original);
  });
});
