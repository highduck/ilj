# XFL/FLA tools library

Library is rapidly port of C/C++ codebase which could be found in `@highduck/exporter` package. Work is in progress.

Purpose of rewriting C/C++ codebase to TypeScript:
- Cross-platform rendering with `canvaskit-wasm` (Google Skia) without need of native dependencies and bindings
- Easier start with JS/TS for readers and contributors
- Easier to do hacks / changes / experiments
- Single modular and cross-platform codebase for tooling with `nodejs`
- Easier to run in browser

## Pipeline

### Processing
1. Parse XFL or FLA file and provide virtual file tree access
2. XML data mapped to JS objects with TypeScript typings
3. Transform JS objects to data model instances
4. Transform document model to internal format model and collect sprites to be rendered

### Rendering
1. Collect render batches and bounds from Element instance
2. Rasterize render batches
3. Save raw image data to sprite image

### Save 
1. Serialize Scene declaration internal format model to minified JSON file
2. Pack sprites to Atlas pages data: images & declarations 

## Roadmap

### 1. MVP

- [x] Bitmap reading (ARGB, CLUT, JPEG)
- [x] Bitmap rendering
- [x] Ani files export
- [x] Atlas packing
- [x] Support for Oval and Rectangle objects
- [x] Strokes: Gradient and Bitmap fills
- [x] Bitmap Fills
- [x] JPEG export support
- [x] Split-alpha export support
- [x] Graphic symbol frame control
- [x] Visibility timeline animation

### 2. Features
- [ ] Masks (Alpha/Color)
- [ ] Motion Object tween
- [ ] Stroke styles - not solid
- [ ] Bitmap font export

### 3. Library

- [ ] Edge SELECTION commands `Sn` processing
- [ ] Complete typings for XML data
- [ ] Add Terms and fix namings
- [ ] Decompose packages
- [ ] Tests
- [ ] Documentation

### 4. Future

- [ ] Font processing
- [ ] Sounds processing
- [ ] Video processing
- [ ] Morphing shapes
- [ ] Bones / IK
- [ ] Warping tool
- [ ] 3D Transforms

## Test data files

- `./testData/tests/`
XFL parsing source file

- `./testData/test_fla.fla`
compressed FLA file test

## mini todo

- [ ] Simple player library, preview application
- [ ] Force sprite symbol (decide flag)
- [ ] Labels and scripts data export and access
- [ ] Rotate mode None
- [ ] StaticText
