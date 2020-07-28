# Ways to create Component types

### Manual

```typescript
export class Interactive {
    static ctor = Interactive;
    static id = newComponentID();

    static new() {
        return new Interactive();
    }

    static map = new IntMap<Interactive>();

    readonly entity!: Entity;
}
_registerComponentType(Interactive);
``` 