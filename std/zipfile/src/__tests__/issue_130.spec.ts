import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as path from 'path';
import { NodeZip } from '../nodejs/NodeZip';

describe('issue #130', () => {
  let basedir = './packages/zipfile/testData';
  if (!fs.existsSync(basedir)) {
    basedir = './testData';
  }

  beforeEach(async () => {
    rimraf.sync(path.join(basedir, 'issue_130/unzipped'));
    rimraf.sync(path.join(basedir, 'issue_130/test.zip'));
  });

  it('zip.extractAllTo()', () => {
    // init the final zip file
    const writeZip = new NodeZip();

    const sourceFolder = path.join(basedir, 'issue_130');

    // file in root folder
    writeZip.addFile('root_file.txt', 'root');

    // add folder
    writeZip.addFile('sub/');

    // file in sub folder
    writeZip.addFile('sub/sub_file.txt', 'sub');

    // files from local folder
    writeZip.addLocalFolder(path.join(sourceFolder, 'nested'), 'nested');

    // write to disk
    writeZip.writeZip(path.join(sourceFolder, 'test.zip'));

    // read zip from disk
    const readZip = NodeZip.fromFile(path.join(sourceFolder, 'test.zip'));

    // unpack everything
    const extractFolder = path.join(sourceFolder, 'unzipped');
    readZip.extractAllTo(extractFolder, true);

    const fileRoot = fs.readFileSync(path.join(extractFolder, 'root_file.txt'), 'utf8');
    // 'root file is correct'
    expect(fileRoot).toEqual('root');

    const fileSub = fs.readFileSync(path.join(extractFolder, 'sub', 'sub_file.txt'), 'utf8');
    // , 'sub file is correct'
    expect(fileSub).toEqual('sub');

    const fileNested = fs.readFileSync(
      path.join(extractFolder, 'nested', 'nested_file.txt'),
      'utf8',
    );
    // nested file is correct
    expect(fileNested).toEqual('nested');

    const fileDeeper = fs.readFileSync(
      path.join(extractFolder, 'nested', 'deeper', 'deeper_file.txt'),
      'utf8',
    );
    // deeper file is correct
    expect(fileDeeper).toEqual('deeper');
  });
});
