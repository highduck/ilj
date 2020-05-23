# Bin Packing

This library based on awesome [RectangleBinPack](https://github.com/juj/RectangleBinPack) work and paper.  

You pass your Rectangles for input. You got packed pages with placed Rectangles.

### Install

```shell script
npm i @highduck/binpack
```
or
```shell script
yarn add @highduck/binpack
```

### Example
```javascript
import { pack } from '@highduck/binpack';

// define input rects
const rects = [
    {w: 10, h: 10},
    {w: 20, h: 20, padding: 1},
    {w: 30, h: 40, padding: 8, data: "MyUserData"}
];

const result = pack(rects, {
    maxWidth: 2048, 
    maxHeight: 2048,
    method: 0, // by default
    rotate: true, // allow rotation, true by default
});

for(const page of result.pages) {
    console.log(page.rects);
}
```


### Algorithm

Simple `MaxRects` with heuristics:

1. Best Area Fit
2. Contact Point
3. Bottom Left
4. Best Long Side Fit
5. Best Short Side Fit
