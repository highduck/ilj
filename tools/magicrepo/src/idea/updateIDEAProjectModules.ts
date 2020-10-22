import * as fs from 'fs';
import * as path from 'path';
import {WorkTree} from "../workspaces/worktree";

/** @deprecated **/
export function updateIDEAProjectModules(worktree: WorkTree): void {
    const basedir = worktree.basedir;

    // remove modules directory
    const modulesDir = path.join(basedir, '.idea/modules');
    fs.rmdirSync(modulesDir, {recursive: true});
    fs.mkdirSync(modulesDir, {recursive: true});

    const moduleNodes: string[] = [];
    const rootName = path.basename(basedir) || 'monorepo';
    for (const workspace of worktree.list) {
        const workspaceBasePath = path.relative(basedir, path.resolve(workspace.url, '..'));
        console.log('path:', workspaceBasePath);

        const moduleId = workspace.pkg.name ? workspace.pkg.name.replace(/\//g, '_')
            : (rootName + (workspaceBasePath.length > 0 ? ('_' + workspaceBasePath.replace(/\//g, '_')) : ''));
        console.log('name:', moduleId);
        const url = `$PROJECT_DIR$/.idea/modules/${moduleId}.iml`;
        moduleNodes.push(`      <module fileurl="file://${url}" filepath="${url}" />`);

        const excludes = ['dist', 'bundle', 'build', 'coverage', 'node_modules'];
        const excludeNodes = excludes.map((s) => {
            const dd = path.join(workspaceBasePath, s);
            return `      <excludeFolder url="file://$MODULE_DIR$/../../${dd}" />`;
        });

        const excludePatterns = ['*.tsbuildinfo', 'yarn.lock'];
        const excludePatternNodes = excludePatterns.map(
            (s) => `      <excludePattern pattern="${s}" />`,
        );
        const iml = `<?xml version="1.0" encoding="UTF-8"?>
<module type="WEB_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$/../../${workspaceBasePath}">
      <sourceFolder url="file://$MODULE_DIR$/../../${path.join(
            workspaceBasePath,
            'src',
        )}" isTestSource="false" />
      <sourceFolder url="file://$MODULE_DIR$/../../${path.join(
            workspaceBasePath,
            'src/__tests__',
        )}" isTestSource="true" />
${excludeNodes.join('\n')}
${excludePatternNodes.join('\n')}
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
</module>`;
        fs.writeFileSync(path.join(basedir, '.idea/modules', `${moduleId}.iml`), iml);
    }
    const modulesXML = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
${moduleNodes.join('\n')}
    </modules>
  </component>
</project>`;
    fs.writeFileSync(path.join(basedir, '.idea/modules.xml'), modulesXML);
}
