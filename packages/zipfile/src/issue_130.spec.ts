import {expect} from 'chai';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as path from 'path';
import {NodeZip} from "./nodejs/NodeZip";

describe('issue #130', () => {

    beforeEach((done) => {
        rimraf.sync("./testData/issue_130/unzipped");
        rimraf.sync("./testData/issue_130/test.zip");
        done();
    });

    it('zip.extractAllTo()', () => {
        // init the final zip file
        const writeZip = new NodeZip();

        const sourceFolder = 'testData/issue_130/';

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
        expect(fileRoot, 'root file is correct').to.eq('root');

        const fileSub = fs.readFileSync(path.join(extractFolder, 'sub', 'sub_file.txt'), 'utf8');
        expect(fileSub, 'sub file is correct').to.eq('sub');

        const fileNested = fs.readFileSync(path.join(extractFolder, 'nested', 'nested_file.txt'), 'utf8');
        expect(fileNested, 'nested file is correct').to.eq('nested');

        const fileDeeper = fs.readFileSync(path.join(extractFolder, 'nested', 'deeper', 'deeper_file.txt'), 'utf8');
        expect(fileDeeper, 'deeper file is correct').to.eq('deeper');
    });
});