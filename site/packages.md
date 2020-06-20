# Package notes

## Each package

- no `tsconfig.json` in packages to allow use root config for IDE

### Project config

- `composite` should be `true`
- `outDir` / `rootDir` should be set
- `"isolatedModules": "false"` is for:
    - packages with entry point
    - or if using `const enum` feature

Simple example of `tsconfig.esm.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist",
    "isolatedModules": false
  },
  "references": [],
  "files": [
    "./src/index.ts"
  ],
  "include": [
    "./src/**/*.ts"
  ],
  "exclude": [
    "**/node_modules",
    "dist/**"
  ]
}
```
