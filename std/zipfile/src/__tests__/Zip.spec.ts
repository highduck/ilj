import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { NodeZip } from '../nodejs/NodeZip';
import * as path from 'path';

describe('adm-zip', () => {
  let basedir = './packages/zipfile/testData';
  if (!fs.existsSync(basedir)) {
    basedir = './testData';
  }
  const destination = path.join(basedir, 'xxx');

  beforeEach(async () => {
    rimraf.sync(destination);
  });

  it('zip.extractAllTo()', () => {
    const zip = NodeZip.fromFile(path.join(basedir, 'assets/ultra.zip'));
    zip.extractAllTo(destination);
    const files = walk(destination);
    expect(files.sort()).toEqual(
      [
        'xxx/attributes_test/asd/New Text Document.txt',
        'xxx/attributes_test/blank file.txt',
        'xxx/attributes_test/New folder/hidden.txt',
        'xxx/attributes_test/New folder/hidden_readonly.txt',
        'xxx/attributes_test/New folder/readonly.txt',
        'xxx/utes_test/New folder/somefile.txt',
      ]
        .map((f) => path.join(basedir, f))
        .sort(),
    );
  });

  it('zip.extractEntryTo(entry, destination, false, true)', () => {
    const zip = NodeZip.fromFile(path.join(basedir, 'assets/ultra.zip'));
    for (const e of zip.getEntries()) {
      zip.extractEntryTo(e, destination, false, true);
    }

    const files = walk(destination);
    expect(files.sort()).toEqual(
      [
        'xxx/blank file.txt',
        'xxx/hidden.txt',
        'xxx/hidden_readonly.txt',
        'xxx/New Text Document.txt',
        'xxx/readonly.txt',
        'xxx/somefile.txt',
      ]
        .map((f) => path.join(basedir, f))
        .sort(),
    );
  });

  it('zip.extractEntryTo(entry, destination, true, true)', () => {
    const zip = NodeZip.fromFile(path.join(basedir, 'assets/ultra.zip'));
    for (const e of zip.getEntries()) {
      zip.extractEntryTo(e, destination, true, true);
    }

    const files = walk(destination);
    expect(files.sort()).toEqual(
      [
        'xxx/attributes_test/asd/New Text Document.txt',
        'xxx/attributes_test/blank file.txt',
        'xxx/attributes_test/New folder/hidden.txt',
        'xxx/attributes_test/New folder/hidden_readonly.txt',
        'xxx/attributes_test/New folder/readonly.txt',
        'xxx/utes_test/New folder/somefile.txt',
      ]
        .map((f) => path.join(basedir, f))
        .sort(),
    );
  });

  it('passes issue-237-Twizzeld test case', () => {
    const zip = NodeZip.fromFile(path.join(basedir, 'assets/issue-237-Twizzeld.zip'));
    for (const e of zip.getEntries()) {
      if (!e.isDirectory) {
        zip.extractEntryTo(e, './', false, true);
        // This should create text.txt on the desktop.
        // It will actually create two, but the first is overwritten by the second.
      }
    }
    const text = fs.readFileSync('./text.txt').toString();
    expect(text).toEqual('ride em cowboy!');
    fs.unlinkSync('./text.txt');
  });

  it('zip.test()', () => {
    const good = NodeZip.fromFile(path.join(basedir, 'crc/good_crc.zip'));
    expect(good.test()).toStrictEqual(true);

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
