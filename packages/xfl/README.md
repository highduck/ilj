# XFL / FLA parsing library

Only NodeJS environment supported currently.

## Pipeline

1. Parse XFL or FLA file and provide virtual file tree access
2. XML data mapped to JS objects with TypeScript typings
3. Transform JS objects to data model instances
4. Exporter as consumer process model and provide converted output 

## Test data files

- `./testData/tests/`
XFL parsing source file

- `./testData/test_fla.fla`
compressed FLA file test

## Bitmap parsing support

Bitmaps data converted later to `RGBA8888` format (not premultiplied alpha)

- Compressed and non-compressed
- Raw Data (ARGB)
- Palette Colors Data (CLUT)
- JPEG image

## About

Library has been rapidly ported from part of C/C++ codebase which could be found in [@highduck/exporter-old](https://github.com/highduck/ilj-exporter-old) package.
