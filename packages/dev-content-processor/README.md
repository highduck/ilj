# General Exporter tooling library

## Animate document export

1. Open document with `@highduck/xfl` and prepare document model 
2. Transform document model to internal format model and collect sprites to be rendered

### Rendering
1. Collect render batches and bounds from Element instance
2. Rasterize render batches
3. Save raw image data to sprite image

### Save 
1. Serialize Scene declaration internal format model to minified JSON file
2. Pack sprites to Atlas pages data: images & declarations 

## Roadmap

### 1. MVP

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
