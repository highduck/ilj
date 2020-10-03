import {updateIDEAProjectModules} from "../idea";
import {WorkTree} from "../workspaces/worktree";
import {updateTSConfigPaths, updateTSProjectReferences} from "../typescript/updateTSConfigPaths";

const basedir = process.cwd();
const worktree = WorkTree.load(basedir);
updateIDEAProjectModules(worktree);
updateTSConfigPaths(worktree);
updateTSProjectReferences(worktree);
