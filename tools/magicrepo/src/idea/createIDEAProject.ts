import * as fs from 'fs';
import * as path from 'path';
import {WorkTree} from "../workspaces/worktree";

function saveModuleIML(basedir: string, moduleURL: string) {
    const modulesXML = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://${moduleURL}" filepath="${moduleURL}" />
    </modules>
  </component>
</project>`;
    fs.writeFileSync(path.join(basedir, '.idea/modules.xml'), modulesXML);
}

export function createIDEAProject(worktree: WorkTree): void {
    const basedir = worktree.basedir;

    // make sure .idea folder exists
    const moduleDir = path.join(basedir, '.idea');
    fs.mkdirSync(moduleDir, {recursive: true});

    const rootName = path.basename(basedir) || 'monorepo';
    const moduleURL = `$PROJECT_DIR$/.idea/${rootName}.iml`;
    const contentNodes: string[] = [];
    for (const workspace of worktree.list) {
        const workspaceBasePath = path.relative(basedir, path.resolve(workspace.url, '..'));
        const sourceURL = `file://$MODULE_DIR$/${path.join(workspaceBasePath, 'src',)}`;
        const testURL = `file://$MODULE_DIR$/${path.join(workspaceBasePath, 'src/__tests__',)}`;
        contentNodes.push(
            `<sourceFolder url="${sourceURL}" isTestSource="false" />`
        );
        contentNodes.push(
            `<sourceFolder url="${testURL}" isTestSource="true" />`
        );
        const excludes = ['dist', 'bundle', 'build', 'coverage', 'node_modules'];
        const excludeNodes = excludes.map((s) => {
            const url = `file://$MODULE_DIR$/${path.join(workspaceBasePath, s)}`;
            return `<excludeFolder url="${url}" />`;
        });
        for (const excludeNode of excludeNodes) {
            contentNodes.push(excludeNode);
        }
    }
    const excludePatterns = ['*.tsbuildinfo', 'yarn.lock'];
    const excludePatternNodes = excludePatterns.map(
        (s) => `<excludePattern pattern="${s}" />`,
    );
    for (const excludePatternNode of excludePatternNodes) {
        contentNodes.push(excludePatternNode);
    }

    const moduleIML = `<?xml version="1.0" encoding="UTF-8"?>
<module type="WEB_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">
      ${contentNodes.join('\n      ')}
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
</module>`;
    fs.writeFileSync(path.join(moduleDir, `${rootName}.iml`), moduleIML);

    saveModuleIML(basedir, moduleURL);
}
