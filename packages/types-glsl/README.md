# import GLSL file

`@types/glsl` package enable `*.glsl` imports as strings from TypeScript code

```typescript
import fs from './2d.frag.glsl';
import vs from './2d.vert.glsl';

console.log(fs);
console.log(vs);
```