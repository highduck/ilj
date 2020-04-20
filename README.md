<p align="center">
    <a href="https://github.com/highduck/ilj">
    <img width="256" height="256" src="ilj-logo.png" alt="ilj">
</p>

<p align="center">
    Various libraries and tools for web game development.
</p>

<p align="center">
    <a href="https://github.com/highduck/ilj"><img alt="Build status" src="https://github.com/highduck/ilj/workflows/Build/badge.svg"></a>
</p>

---

All of these are in phase of **p**assive development.

*Please note that the provided code is amateurish, unprofessional and potentially not suitable for developing serious games or applications. You can freely use it under a license at your own risk. we do not bear any responsibility for the time spent and we do not commit ourselves to provide lifelong support and advice.*

This is monorepo based on [Yarn 2](https://yarnpkg.com/) package manager workspaces.

## Development

### Prerequisites

- `node.js`, `npm`, `yarn`
- build native libraries: `conan`, `cmake`, any local c++ compile toolchain
- convert audio files: `ffmpeg`

### Standalone development

Yarn2 runtime files excluded. To work with the repository you have to install and init `yarn 2`:
```shell script
yarn policies set-version berry
yarn set version latest
yarn config set nodeLinker node-modules
yarn plugin import @yarnpkg/plugin-interactive-tools
yarn plugin import @yarnpkg/plugin-workspace-tools
yarn
```

### Using development copy (local or submodule)

If you want to contribute during your projects development, you could add git submodule or local folder `ilj/` as nested workspace subtree