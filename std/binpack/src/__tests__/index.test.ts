import { Method, pack } from '..';

describe('packing methods', () => {
  for (const method of [
    Method.All,
    Method.BestAreaFit,
    Method.BestLongSideFit,
    Method.BestShortSideFit,
    Method.BottomLeft,
    Method.ContactPoint,
  ]) {
    it('packing method #' + method.toString(), () => {
      const padding = 2;
      const border = 0;
      const width = 1000;
      const height = 20;

      const result = pack(
        [
          {
            w: width,
            h: height,
            padding,
            data: { myData: true },
          },
        ],
        {
          maxWidth: 2048,
          maxHeight: 2048,
          method,
        },
      );

      expect(result.pages.length).toStrictEqual(1);
      expect(result.notPacked.length).toStrictEqual(0);

      // rotate should be passed from input
      expect(result.rotate).toStrictEqual(true);

      expect(result.method).toStrictEqual(method);

      const page = result.pages[0];
      expect(page.w).toStrictEqual(1024);
      expect(page.h).toStrictEqual(512);

      // selected method should be specific
      expect(page.method).not.toStrictEqual(Method.All);

      const rc = page.rects[0];
      expect(rc.x).toStrictEqual(padding + border);
      expect(rc.y).toStrictEqual(padding + border);
      expect(rc.w).toStrictEqual(width);
      expect(rc.h).toStrictEqual(height);
      expect(rc.rotated).toStrictEqual(false);
      expect(rc.data).toBeDefined();
      expect(rc.data.myData).toBeTruthy();
    });
  }
});

describe('pack 5 nodes', () => {
  for (const method of [
    Method.All,
    Method.BestAreaFit,
    Method.BestLongSideFit,
    Method.BestShortSideFit,
    Method.BottomLeft,
    Method.ContactPoint,
  ]) {
    it('packing method #' + method.toString(), () => {
      const padding = 1;
      const w = 2;
      const h = 1;

      const result = pack(
        [
          { w, h, padding },
          { w, h, padding },
          { w, h, padding },
          { w, h, padding },
          { w, h, padding },
        ],
        {
          maxWidth: 2048,
          maxHeight: 2048,
          method,
        },
      );

      expect(result.pages.length).toStrictEqual(1);
      expect(result.notPacked.length).toStrictEqual(0);
      expect(result.pages[0].rects).toHaveLength(5);
    });
  }
});

describe('very big size should not be packed', () => {
  for (const method of [
    Method.All,
    Method.BestAreaFit,
    Method.BestLongSideFit,
    Method.BestShortSideFit,
    Method.BottomLeft,
    Method.ContactPoint,
  ]) {
    it('packing method #' + method.toString(), () => {
      // also test default padding = 0
      const result = pack(
        [
          { w: 100, h: 100 },
          { w: 100, h: 100 },
          { w: 100, h: 100 },
          { w: 100, h: 3000 },
          { w: 3000, h: 100 },
        ],
        {
          maxWidth: 128,
          maxHeight: 128,
          method,
        },
      );

      expect(result.pages.length).toStrictEqual(3);
      expect(result.notPacked.length).toStrictEqual(2);
      expect(result.pages[0].rects).toHaveLength(1);
      expect(result.pages[1].rects).toHaveLength(1);
      expect(result.pages[2].rects).toHaveLength(1);
    });
  }
});

test('not integer padding throws', () => {
  expect(() =>
    pack([{ w: 1, h: 1, padding: 0.5 }], {
      maxWidth: 128,
      maxHeight: 128,
    }),
  ).toThrow();
});
