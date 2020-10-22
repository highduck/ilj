import {createIDEAProject} from "../idea";
import {WorkTree} from "../workspaces/worktree";
import {updateTSConfigPaths, updateTSProjectReferences} from "../typescript/updateTSConfigPaths";

const basedir = process.cwd();
const worktree = WorkTree.load(basedir);
createIDEAProject(worktree);
updateTSConfigPaths(worktree);
updateTSProjectReferences(worktree);
