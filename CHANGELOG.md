## 2020.05.16

### XFL

- Fix loading path with extensions `.fla` / `.xfl`
- Fix decompress small `.fla` files
- Animations visibility control 
- Output scene optimization
- Fix closed stroke path
- Fix oval object path
- Remove MovieClip static layers
- Default easing serialization and renaming (test_0: 332kb to 313kb)
- Label `*static` force symbol item to be flatten into the sprite
- Update CanvasKit-WASM to 0.15.0
- Logging functions separated
- Load bitmap data will un-multiply colors by alpha
- More Flash DOM objects declaration

### XFL test

- Add test assets

### Projects

- Set TypeScript declarations dir to `dist/types`. Resolve project reference conflicts between `esm` and `commonjs` outputs.
- Update Capacitor to 2.1.0, and all another dependencies
- Removed old exporter package

### CLI

- Removed `ts-node` dependency. Now easier to use TypeScript compiler to build all dependencies.
