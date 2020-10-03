// not implemented..
export const PolyBool = {};

// primary | secondary
// above1 below1 above2 below2    Keep?               Value
//    0      0      0      0   =>   no                  0
//    0      0      0      1   =>   yes filled below    2
//    0      0      1      0   =>   yes filled above    1
//    0      0      1      1   =>   no                  0
//    0      1      0      0   =>   yes filled below    2
//    0      1      0      1   =>   yes filled below    2
//    0      1      1      0   =>   no                  0
//    0      1      1      1   =>   no                  0
//    1      0      0      0   =>   yes filled above    1
//    1      0      0      1   =>   no                  0
//    1      0      1      0   =>   yes filled above    1
//    1      0      1      1   =>   no                  0
//    1      1      0      0   =>   no                  0
//    1      1      0      1   =>   no                  0
//    1      1      1      0   =>   no                  0
//    1      1      1      1   =>   no                  0
const UNION: Uint8Array = new Uint8Array([
  0,
  0x4,
  0x8,
  0,
  0x4,
  0x4,
  0,
  0,
  0x8,
  0,
  0x8,
  0,
  0,
  0,
  0,
  0,
]);

// primary & secondary
// above1 below1 above2 below2    Keep?               Value
//    0      0      0      0   =>   no                  0
//    0      0      0      1   =>   no                  0
//    0      0      1      0   =>   no                  0
//    0      0      1      1   =>   no                  0
//    0      1      0      0   =>   no                  0
//    0      1      0      1   =>   yes filled below    2
//    0      1      1      0   =>   no                  0
//    0      1      1      1   =>   yes filled below    2
//    1      0      0      0   =>   no                  0
//    1      0      0      1   =>   no                  0
//    1      0      1      0   =>   yes filled above    1
//    1      0      1      1   =>   yes filled above    1
//    1      1      0      0   =>   no                  0
//    1      1      0      1   =>   yes filled below    2
//    1      1      1      0   =>   yes filled above    1
//    1      1      1      1   =>   no                  0
const INTERSECT: Uint8Array = new Uint8Array([
  0,
  0,
  0,
  0,
  0,
  0x4,
  0,
  0x4,
  0,
  0,
  0x8,
  0x8,
  0,
  0x4,
  0x8,
  0,
]);

// primary - secondary
// above1 below1 above2 below2    Keep?               Value
//    0      0      0      0   =>   no                  0
//    0      0      0      1   =>   no                  0
//    0      0      1      0   =>   no                  0
//    0      0      1      1   =>   no                  0
//    0      1      0      0   =>   yes filled below    2
//    0      1      0      1   =>   no                  0
//    0      1      1      0   =>   yes filled below    2
//    0      1      1      1   =>   no                  0
//    1      0      0      0   =>   yes filled above    1
//    1      0      0      1   =>   yes filled above    1
//    1      0      1      0   =>   no                  0
//    1      0      1      1   =>   no                  0
//    1      1      0      0   =>   no                  0
//    1      1      0      1   =>   yes filled above    1
//    1      1      1      0   =>   yes filled below    2
//    1      1      1      1   =>   no                  0
const DIFF: Uint8Array = new Uint8Array([
  0,
  0,
  0,
  0,
  0x4,
  0,
  0x4,
  0,
  0x8,
  0x8,
  0,
  0,
  0,
  0x8,
  0x4,
  0,
]);

// secondary - primary
// above1 below1 above2 below2    Keep?               Value
//    0      0      0      0   =>   no                  0
//    0      0      0      1   =>   yes filled below    2
//    0      0      1      0   =>   yes filled above    1
//    0      0      1      1   =>   no                  0
//    0      1      0      0   =>   no                  0
//    0      1      0      1   =>   no                  0
//    0      1      1      0   =>   yes filled above    1
//    0      1      1      1   =>   yes filled above    1
//    1      0      0      0   =>   no                  0
//    1      0      0      1   =>   yes filled below    2
//    1      0      1      0   =>   no                  0
//    1      0      1      1   =>   yes filled below    2
//    1      1      0      0   =>   no                  0
//    1      1      0      1   =>   no                  0
//    1      1      1      0   =>   no                  0
//    1      1      1      1   =>   no                  0
const DIFF_REV: Uint8Array = new Uint8Array([
  0,
  0x4,
  0x8,
  0,
  0,
  0,
  0x8,
  0x8,
  0,
  0x4,
  0,
  0x4,
  0,
  0,
  0,
  0,
]);

// primary ^ secondary
// above1 below1 above2 below2    Keep?               Value
//    0      0      0      0   =>   no                  0
//    0      0      0      1   =>   yes filled below    2
//    0      0      1      0   =>   yes filled above    1
//    0      0      1      1   =>   no                  0
//    0      1      0      0   =>   yes filled below    2
//    0      1      0      1   =>   no                  0
//    0      1      1      0   =>   no                  0
//    0      1      1      1   =>   yes filled above    1
//    1      0      0      0   =>   yes filled above    1
//    1      0      0      1   =>   no                  0
//    1      0      1      0   =>   no                  0
//    1      0      1      1   =>   yes filled below    2
//    1      1      0      0   =>   no                  0
//    1      1      0      1   =>   yes filled above    1
//    1      1      1      0   =>   yes filled below    2
//    1      1      1      1   =>   no                  0
const XOR: Uint8Array = new Uint8Array([
  0,
  0x4,
  0x8,
  0,
  0x4,
  0,
  0,
  0x8,
  0x8,
  0,
  0,
  0x4,
  0,
  0x8,
  0x4,
  0,
]);

const EPSILON = 0.0000000001;

const CHAINER_MATCHES = [0, 0];
const CHAINER_FLAG_HEAD = 0x20000000;
const CHAINER_FLAG_PT = 0x40000000;

/*** Fill flags ***/

const FILL_OTHER_BELOW = 0x1;
const FILL_OTHER_ABOVE = 0x2;
const FILL_BELOW = 0x4;
const FILL_ABOVE = 0x8;
const FILL_BELOW_UNDEFINED = 0x10;
const FILL_OTHER_UNDEFINED = 0x20;
const FILL_MASK_MY = FILL_BELOW | FILL_ABOVE;
const FILL_MASK_OTHER = FILL_OTHER_BELOW | FILL_OTHER_ABOVE;
const FILL_MASK_INDEX = FILL_MASK_MY | FILL_MASK_OTHER;
const FILL_NULL = FILL_OTHER_UNDEFINED | FILL_BELOW_UNDEFINED;

type Fill = number;

function getFillIndex(seg: Segment): number {
  return seg.fill & FILL_MASK_INDEX;
}

function fill_setOtherDefined(f: Fill): Fill {
  return f & ~FILL_OTHER_UNDEFINED;
}

//
function fill_isOtherUndefined(f: Fill): boolean {
  return (f & FILL_OTHER_UNDEFINED) != 0;
}

function fill_flip(f: Fill): Fill {
  return ((f & FILL_MASK_MY) >>> 2) | ((f & FILL_MASK_OTHER) << 2);
}

function fill_init(above: boolean, below: boolean): Fill {
  return (above ? FILL_ABOVE : 0x0) | (below ? FILL_BELOW : 0x0);
}

function fill_checkToggle(f: Fill): boolean {
  return ((f & FILL_BELOW_UNDEFINED) | (((f >>> 1) ^ f) & FILL_BELOW)) != 0;
}

function fill_toggleAbove(f: Fill): Fill {
  return (f & FILL_ABOVE) != 0 ? f & ~FILL_ABOVE : f | FILL_ABOVE;
}

function fill_toggleBelow(f: Fill): Fill {
  return (f & FILL_BELOW) != 0 ? f & ~FILL_BELOW : f | FILL_BELOW;
}

function fill_setAbove(f: Fill, value: boolean): Fill {
  return value ? f | FILL_ABOVE : f & ~FILL_ABOVE;
}

function fill_setBelow(f: Fill, value: boolean): Fill {
  return (value ? f | FILL_BELOW : f & ~FILL_BELOW) & ~FILL_BELOW_UNDEFINED;
}

function fill_copyToOther(f: Fill): Fill {
  return (f & ~FILL_MASK_OTHER) | ((f & FILL_MASK_MY) >>> 2);
}

interface Vector2 {
  x: number;
  y: number;
}

class LineIntersectionResult {
  hit = false;
  point: Vector2 = { x: 0, y: 0 };
  alongA = 0;
  alongB = 0;
}

class Segment {
  fill: Fill;

  constructor(public start: Vector2, public end: Vector2, fill: Fill) {
    this.fill = (fill & (FILL_MASK_MY | FILL_BELOW_UNDEFINED)) | FILL_OTHER_UNDEFINED;
  }
}

class CombinedSegmentList {
  combined: Segment[] = [];
  inverted1 = false;
  inverted2 = false;
}

class EventNode {
  next: EventNode | null = null;
  prev: EventNode | null = null;

  other: EventNode | null = null;
  status: StatusNode | null = null;

  constructor(
    public isStart: boolean,
    public pt: Vector2,
    public seg: Segment,
    public primary: boolean,
  ) {}
}

class StatusNode {
  next: StatusNode | null = null;
  prev: StatusNode | null = null;

  constructor(public ev: EventNode) {}
}

class SegmentList {
  segments: Segment[] = [];
  inverted = false;
}

class SegmentChainMatchInfo {
  index = 0;
  matches_head = false;
  matches_pt1 = false;

  set(index: number, matches_head: boolean, matches_pt1: boolean) {
    this.index = index;
    this.matches_head = matches_head;
    this.matches_pt1 = matches_pt1;
  }
}

class Transition {
  prev: StatusNode | null = null;
  here: StatusNode | null = null;
}

type Region = Vector2[];

class Polygon {
  regions: Region[] = [];
  inverted = false;
}

class PolyNode {
  children: PolyNode[] = [];

  constructor(public region: Region | null) {}

  addChild(region: Region) {
    // first check if we're inside any children
    for (let i = 0; i < this.children.length; ++i) {
      const child = this.children[i];
      if (regionInsideRegion(region, child.region!)) {
        // we are, so insert inside them instead
        child.addChild(region);
        return;
      }
    }

    // not inside any children, so check to see if any children are inside us
    const node = new PolyNode(region);
    let i = 0;
    while (i < this.children.length) {
      const child = this.children[i];
      if (regionInsideRegion(child.region!, region)) {
        // oops... move the child beneath us, and remove them from root
        node.children.push(child);
        this.children.splice(i, 1);
        --i;
      }
      ++i;
    }

    // now we can add ourselves
    this.children.push(node);
  }
}

// PolyBool utility

function pointInsideRegion(x: number, y: number, region: Region): boolean {
  let last_x = region[region.length - 1].x;
  let last_y = region[region.length - 1].y;
  let inside = false;
  for (let i = 0; i < region.length; ++i) {
    const curr_x = region[i].x;
    const curr_y = region[i].y;

    // if y is between curr_y and last_y, and
    // x is to the right of the boundary created by the line
    if (
      curr_y - y > EPSILON != last_y - y > EPSILON &&
      ((last_x - curr_x) * (y - curr_y)) / (last_y - curr_y) + curr_x - x > EPSILON
    ) {
      inside = !inside;
    }

    last_x = curr_x;
    last_y = curr_y;
  }
  return inside;
}

function pointBetween(p: Vector2, left: Vector2, right: Vector2): boolean {
  // p must be collinear with left->right
  // returns false if p == left, p == right, or left == right
  const d_py_ly = p.y - left.y;
  const d_rx_lx = right.x - left.x;
  const d_px_lx = p.x - left.x;
  const d_ry_ly = right.y - left.y;

  const dot = d_px_lx * d_rx_lx + d_py_ly * d_ry_ly;
  // if `dot` is 0, then `p` == `left` or `left` == `right` (reject)
  // if `dot` is less than 0, then `p` is to the left of `left` (reject)
  if (dot < EPSILON) {
    return false;
  }

  const sqlen = d_rx_lx * d_rx_lx + d_ry_ly * d_ry_ly;
  // if `dot` > `sqlen`, then `p` is to the right of `right` (reject)
  // therefore, if `dot - sqlen` is greater than 0, then `p` is to the right of `right` (reject)
  // 		return dot - sqlen <= -EPSILON;
  return sqlen - dot > EPSILON;
}

function pointsSame(p1: Vector2, p2: Vector2): boolean {
  if (p1 == p2) {
    return true;
  }
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx < EPSILON && -dx < EPSILON && dy < EPSILON && -dy < -EPSILON;
  // 		return dx*dx + dy*dy < EPSILON;
}

function pointsCompare(p1: Vector2, p2: Vector2): number {
  // returns -1 if p1 is smaller, 1 if p2 is smaller, 0 if equal
  if (Math.abs(p1.x - p2.x) < EPSILON) {
    return Math.abs(p1.y - p2.y) < EPSILON ? 0 : p1.y < p2.y ? -1 : 1;
  }
  return p1.x < p2.x ? -1 : 1;
}

function pointsCollinear(pt1: Vector2, pt2: Vector2, pt3: Vector2): boolean {
  // does pt1->pt2->pt3 make a straight line?
  // essentially this is just checking to see if the slope(pt1->pt2) === slope(pt2->pt3)
  // if slopes are equal, then they must be collinear, because they share pt2
  const dx1 = pt1.x - pt2.x;
  const dy1 = pt1.y - pt2.y;
  const dx2 = pt2.x - pt3.x;
  const dy2 = pt2.y - pt3.y;
  return Math.abs(dx1 * dy2 - dx2 * dy1) < EPSILON;
}

function linesIntersect(
  a0: Vector2,
  a1: Vector2,
  b0: Vector2,
  b1: Vector2,
  outResult: LineIntersectionResult,
) {
  // returns false if the lines are coincident (e.g., parallel or on top of each other)
  //
  // returns an object if the lines intersect:
  //   {
  //     pt: [x, y],    where the intersection point is at
  //     alongA: where intersection point is along A,
  //     alongB: where intersection point is along B
  //   }
  //
  //  alongA and alongB will each be one of: -2, -1, 0, 1, 2
  //
  //  with the following meaning:
  //
  //    -2   intersection point is before segment's first point
  //    -1   intersection point is directly on segment's first point
  //     0   intersection point is between segment's first and second points (exclusive)
  //     1   intersection point is directly on segment's second point
  //     2   intersection point is after segment's second point
  const adx = a1.x - a0.x;
  const ady = a1.y - a0.y;
  const bdx = b1.x - b0.x;
  const bdy = b1.y - b0.y;

  const axb = adx * bdy - ady * bdx;
  if (Math.abs(axb) < EPSILON) {
    // lines are coincident
    outResult.hit = false;
    return;
  }

  const dx = a0.x - b0.x;
  const dy = a0.y - b0.y;

  const A = (bdx * dy - bdy * dx) / axb;
  const B = (adx * dy - ady * dx) / axb;

  outResult.hit = true;
  outResult.point.x = a0.x + A * adx;
  outResult.point.y = a0.y + A * ady;

  // categorize where intersection point is along A and B

  if (A <= -EPSILON) {
    outResult.alongA = -2;
  } else if (A < EPSILON) {
    outResult.alongA = -1;
  } else if (A - 1 <= -EPSILON) {
    outResult.alongA = 0;
  } else if (A - 1 < EPSILON) {
    outResult.alongA = 1;
  } else {
    outResult.alongA = 2;
  }

  if (B <= -EPSILON) {
    outResult.alongB = -2;
  } else if (B < EPSILON) {
    outResult.alongB = -1;
  } else if (B - 1 <= -EPSILON) {
    outResult.alongB = 0;
  } else if (B - 1 < EPSILON) {
    outResult.alongB = 1;
  } else {
    outResult.alongB = 2;
  }
}

// core API
function segments(poly: Polygon): SegmentList {
  const i = new Intersecter();
  for (const r of poly.regions) {
    i.addRegion(r);
  }

  const sp = new SegmentList();
  sp.segments = i.calculateWithSelfIntersection(poly.inverted);
  sp.inverted = poly.inverted;
  return sp;
}

function combine(segments1: SegmentList, segments2: SegmentList): CombinedSegmentList {
  const i3 = new Intersecter();
  const result = new CombinedSegmentList();
  result.combined = i3.calculateNoSelfIntersection(
    segments1.segments,
    segments1.inverted,
    segments2.segments,
    segments2.inverted,
  );
  result.inverted1 = segments1.inverted;
  result.inverted2 = segments2.inverted;
  return result;
}

function selectUnion(combined: CombinedSegmentList): SegmentList {
  const result = new SegmentList();
  result.segments = select(combined.combined, UNION);
  result.inverted = combined.inverted1 || combined.inverted2;
  return result;
}

function selectIntersect(combined: CombinedSegmentList): SegmentList {
  const result = new SegmentList();
  result.segments = select(combined.combined, INTERSECT);
  result.inverted = combined.inverted1 && combined.inverted2;
  return result;
}

function selectDifference(combined: CombinedSegmentList): SegmentList {
  const result = new SegmentList();
  result.segments = select(combined.combined, DIFF);
  result.inverted = combined.inverted1 && !combined.inverted2;
  return result;
}

function selectDifferenceRev(combined: CombinedSegmentList): SegmentList {
  const result = new SegmentList();
  result.segments = select(combined.combined, DIFF_REV);
  result.inverted = !combined.inverted1 && combined.inverted2;
  return result;
}

function selectXor(combined: CombinedSegmentList): SegmentList {
  const result = new SegmentList();
  result.segments = select(combined.combined, XOR);
  result.inverted = combined.inverted1 != combined.inverted2;
  return result;
}

function polygon(segments: SegmentList): Polygon {
  const result = new Polygon();
  result.regions = buildChains(segments.segments);
  result.inverted = segments.inverted;
  return result;
}

// helper functions for common operations
function union(poly1: Polygon, poly2: Polygon) {
  return operate(poly1, poly2, selectUnion);
}

function intersect(poly1: Polygon, poly2: Polygon) {
  return operate(poly1, poly2, selectIntersect);
}

function difference(poly1: Polygon, poly2: Polygon) {
  return operate(poly1, poly2, selectDifference);
}

function differenceRev(poly1: Polygon, poly2: Polygon) {
  return operate(poly1, poly2, selectDifferenceRev);
}

function xor(poly1: Polygon, poly2: Polygon) {
  return operate(poly1, poly2, selectXor);
}

function operate(
  poly1: Polygon,
  poly2: Polygon,
  selector: (c: CombinedSegmentList) => SegmentList,
): Polygon {
  const seg1 = segments(poly1);
  const seg2 = segments(poly2);
  const comb = combine(seg1, seg2);
  const seg3 = selector(comb);
  return polygon(seg3);
}

function select(segments: Segment[], selection: Uint8Array) {
  const result = [];
  for (const seg of segments) {
    const index = getFillIndex(seg);
    const sel = selection[index];
    if (sel != 0) {
      // copy the segment to the results, while also calculating the fill status
      result.push(new Segment(seg.start, seg.end, sel));
    }
  }
  return result;
}

function regionInsideRegion(r1: Region, r2: Region) {
  // we're guaranteed no lines intersect (because the polygon is clean), but a vertex
  // could be on the edge -- so we just average pt[0] and pt[1] to produce a point on the
  // edge of the first line, which cannot be on an edge
  return pointInsideRegion((r1[0].x + r1[1].x) * 0.5, (r1[0].y + r1[1].y) * 0.5, r2);
}

function forceWinding(region: Region, clockwise: boolean): Region {
  return region;
}

function addExterior(node: PolyNode, result: Region[][]) {
  const poly = [forceWinding(node.region!, false)];
  result.push(poly);
  // children of exteriors are interior
  for (let i = 0; i < node.children.length; ++i) {
    poly.push(getInterior(node.children[i], result));
  }
}

function getInterior(node: PolyNode, result: Region[][]): Region {
  // children of interiors are exterior
  for (let i = 0; i < node.children.length; ++i) {
    addExterior(node.children[i], result);
  }
  // return the clockwise interior
  return forceWinding(node.region!, true);
}

// convert a PolyBool polygon to a GeoJSON object
function getMultiPolygon(poly: Polygon): Region[][] {
  // make sure out polygon is clean
  // TODO: flag?
  // poly = polygon(segments(poly));

  // test if r1 is inside r2

  // calculate inside heirarchy
  //
  //  _____________________   _______    roots -> A       -> F
  // |          A          | |   F   |            |          |
  // |  _______   _______  | |  ___  |            +-- B      +-- G
  // | |   B   | |   C   | | | |   | |            |   |
  // | |  ___  | |  ___  | | | |   | |            |   +-- D
  // | | | D | | | | E | | | | | G | |            |
  // | | |___| | | |___| | | | |   | |            +-- C
  // | |_______| |_______| | | |___| |                |
  // |_____________________| |_______|                +-- E

  const roots = new PolyNode(null);

  // add all regions to the root
  for (let i = 0; i < poly.regions.length; ++i) {
    const region = poly.regions[i];
    if (region.length < 3) {
      // regions must have at least 3 points (sanity check)
      continue;
    }
    roots.addChild(region);
  }

  // with our heirarchy, we can distinguish between exterior borders, and interior holes
  // the root nodes are exterior, children are interior, children's children are exterior,
  // children's children's children are interior, etc

  // while we're at it, exteriors are counter-clockwise, and interiors are clockwise

  const geopolys: Region[][] = [];

  // root nodes are exterior
  for (let i = 0; i < roots.children.length; ++i) {
    addExterior(roots.children[i], geopolys);
  }

  return geopolys;
}

function reverseChain(chains: Vector2[][], index: number) {
  chains[index].reverse(); // gee, that's easy
}

function appendChain(chains: Vector2[][], index1: number, index2: number) {
  // index1 gets index2 appended to it, and index2 is removed
  const chain1 = chains[index1];
  const chain2 = chains[index2];
  let tail = chain1[chain1.length - 1];
  const tail2 = chain1[chain1.length - 2];
  const head = chain2[0];
  const head2 = chain2[1];

  if (pointsCollinear(tail2, tail, head)) {
    // tail isn't needed because it's directly between tail2 and head
    // tail2 ---tail---> head
    chain1.pop();
    tail = tail2; // old tail is gone... new tail is what tail2 was
  }

  if (pointsCollinear(tail, head, head2)) {
    // head isn't needed because it's directly between tail and head2
    // tail ---head---> head2
    chain2.shift();
  }

  chains[index1] = chain1.concat(chain2);
  chains.splice(index2, 1);
}

function buildChains(segments: Segment[]): Region[] {
  const chains: Region[] = [];
  const regions: Region[] = [];

  for (const seg of segments) {
    const pt1 = seg.start;
    const pt2 = seg.end;

    // search for two chains that this segment matches
    let current_match = 0;
    let i = 0;
    const end = chains.length;
    while (i < end && current_match < 2) {
      const chain = chains[i];
      const head = chain[0];
      const tail = chain[chain.length - 1];
      if (pointsSame(head, pt1)) {
        CHAINER_MATCHES[current_match++] = i | CHAINER_FLAG_HEAD | CHAINER_FLAG_PT;
      } else if (pointsSame(head, pt2)) {
        CHAINER_MATCHES[current_match++] = i | CHAINER_FLAG_HEAD;
      } else if (pointsSame(tail, pt1)) {
        CHAINER_MATCHES[current_match++] = i | CHAINER_FLAG_PT;
      } else if (pointsSame(tail, pt2)) {
        CHAINER_MATCHES[current_match++] = i;
      }
      ++i;
    }

    if (current_match == 0) {
      // we didn't match anything, so create a new chain
      chains.push([pt1, pt2]);
      continue;
    }

    const m0 = CHAINER_MATCHES[0];
    const F = m0 & 0x1fffffff;
    const addToHead_0 = (m0 & CHAINER_FLAG_HEAD) != 0;

    if (current_match == 1) {
      // we matched a single chain

      // add the other point to the apporpriate end, and check to see if we've closed the
      // chain into a loop

      const pt = (m0 & CHAINER_FLAG_PT) != 0 ? pt2 : pt1; // if we matched pt1, then we add pt2, etc
      // if we matched at head, then add to the head

      const chain = chains[F];

      if (addToHead_0) {
        let grow = chain[0];
        const grow2 = chain[1];
        const oppo = chain[chain.length - 1];
        if (pointsCollinear(grow2, grow, pt)) {
          chain.shift();
          grow = grow2;
        }

        if (pointsSame(oppo, pt)) {
          chains.splice(F, 1);
          if (pointsCollinear(chain[chain.length - 2], oppo, grow)) {
            chain.pop();
          }
          regions.push(chain);
          continue;
        }
        chain.unshift(pt);
        continue;
      } else {
        let grow = chain[chain.length - 1];
        const grow2 = chain[chain.length - 2];

        if (pointsCollinear(grow2, grow, pt)) {
          chain.pop();
          grow = grow2;
        }

        const oppo = chain[0];
        if (pointsSame(oppo, pt)) {
          chains.splice(F, 1);
          if (pointsCollinear(chain[1], oppo, grow)) {
            chain.shift();
          }
          regions.push(chain);
          continue;
        }
        chain.push(pt);
        continue;
      }
    }

    // otherwise, we matched two chains, so we need to combine those chains together
    const m1 = CHAINER_MATCHES[1];
    const S = m1 & 0x1fffffff;

    const reverseF = chains[F].length < chains[S].length; // reverse the shorter chain, if needed
    if (addToHead_0) {
      if ((m1 & CHAINER_FLAG_HEAD) != 0) {
        if (reverseF) {
          // <<<< F <<<< --- >>>> S >>>>
          reverseChain(chains, F);
          // >>>> F >>>> --- >>>> S >>>>
          appendChain(chains, F, S);
        } else {
          // <<<< F <<<< --- >>>> S >>>>
          reverseChain(chains, S);
          // <<<< F <<<< --- <<<< S <<<<   logically same as:
          // >>>> S >>>> --- >>>> F >>>>
          appendChain(chains, S, F);
        }
      } else {
        // <<<< F <<<< --- <<<< S <<<<   logically same as:
        // >>>> S >>>> --- >>>> F >>>>
        appendChain(chains, S, F);
      }
    } else if ((m1 & CHAINER_FLAG_HEAD) != 0) {
      // >>>> F >>>> --- >>>> S >>>>
      appendChain(chains, F, S);
    } else if (reverseF) {
      // >>>> F >>>> --- <<<< S <<<<
      reverseChain(chains, F);
      // <<<< F <<<< --- <<<< S <<<<   logically same as:
      // >>>> S >>>> --- >>>> F >>>>
      appendChain(chains, S, F);
    } else {
      // >>>> F >>>> --- <<<< S <<<<
      reverseChain(chains, S);
      // >>>> F >>>> --- >>>> S >>>>
      appendChain(chains, F, S);
    }
  }
  return regions;
}

// Intersecter.hx

class Intersecter {
  static eventLess(
    p1_isStart: boolean,
    p1_1: Vector2,
    p1_2: Vector2,
    p2_isStart: boolean,
    p2_1: Vector2,
    p2_2: Vector2,
  ): boolean {
    // compare the selected points first
    // returns -1 if p1 is smaller, 1 if p2 is smaller, 0 if equal
    if (p1_1 !== p2_1) {
      if (Math.abs(p1_1.x - p2_1.x) >= EPSILON) {
        return p1_1.x < p2_1.x;
      } else if (Math.abs(p1_1.y - p2_1.y) >= EPSILON) {
        return p1_1.y < p2_1.y;
      }
    }

    // the selected points are the same

    const x = p1_2.x;
    const y = p1_2.y;
    // 		var dx = x - p2_2.x;
    // 		var dy = y - p2_2.y;
    // if the non-selected points are the same too...
    // 		if (dx > -PolyBool.EPSILON && dx < PolyBool.EPSILON && dy > -PolyBool.EPSILON && dy < PolyBool.EPSILON) {
    if (p1_2 == p2_2 || (Math.abs(x - p2_2.x) < EPSILON && Math.abs(y - p2_2.y) < EPSILON)) {
      return false; // then the segments are equal
    }

    // if one is a start and the other isn't...
    if (p1_isStart != p2_isStart) {
      return !p1_isStart; // favor the one that isn't the start
    }

    // otherwise, we'll have to calculate which one is below the other manually
    const right: Vector2 = p2_isStart ? p2_2 : p2_1;
    const left: Vector2 = p2_isStart ? p2_1 : p2_2;

    const Ax = left.x;
    const Ay = left.y;
    const Bx = right.x;
    const By = right.y;
    return (By - Ay) * (x - Ax) - (Bx - Ax) * (y - Ay) >= EPSILON;
  }

  event_head: EventNode | null = null;
  status_head: StatusNode | null = null;
  readonly lir: LineIntersectionResult = new LineIntersectionResult();

  eventAddSegment(seg: Segment, primary: boolean): EventNode {
    const ev_start = new EventNode(true, seg.start, seg, primary);
    const ev_end = new EventNode(false, seg.end, seg, primary);
    ev_end.other = ev_start;
    ev_start.other = ev_end;

    this.insertNodeBefore(ev_start, seg.end);
    this.insertNodeBefore(ev_end, seg.start);

    return ev_start;
  }

  eventDivide(ev: EventNode, pt: Vector2): EventNode {
    const ns = new Segment(pt, ev.seg!.end, ev.seg!.fill);

    // slides an end backwards
    //   (start)------------(end)    to:
    //   (start)---(end)

    this.removeNode(ev.other!);
    ev.seg!.end = pt;
    ev.other!.pt = pt;
    this.insertNodeBefore(ev.other!, ev.pt);

    return this.eventAddSegment(ns, ev.primary);
  }

  checkIntersection(ev1: EventNode, ev2: EventNode): EventNode | null {
    // returns the segment equal to ev1, or false if nothing equal

    const seg1 = ev1.seg;
    const seg2 = ev2.seg;
    const a1 = seg1.start;
    const a2 = seg1.end;
    const b1 = seg2.start;
    const b2 = seg2.end;

    const i = this.lir;
    linesIntersect(a1, a2, b1, b2, i);

    if (!i.hit) {
      // segments are parallel or coincident

      // if points aren't collinear, then the segments are parallel, so no intersections
      if (!pointsCollinear(a1, a2, b1)) {
        return null;
      }
      // otherwise, segments are on top of each other somehow (aka coincident)

      if (pointsSame(a1, b2) || pointsSame(a2, b1)) {
        return null;
      } // segments touch at endpoints... no intersection

      const a1_equ_b1 = pointsSame(a1, b1);
      const a2_equ_b2 = pointsSame(a2, b2);

      if (a1_equ_b1 && a2_equ_b2) {
        return ev2;
      } // segments are exactly equal

      const a1_between = !a1_equ_b1 && pointBetween(a1, b1, b2);
      const a2_between = !a2_equ_b2 && pointBetween(a2, b1, b2);

      if (a1_equ_b1) {
        if (a2_between) {
          //  (a1)---(a2)
          //  (b1)----------(b2)
          this.eventDivide(ev2, a2);
        } else {
          //  (a1)----------(a2)
          //  (b1)---(b2)
          this.eventDivide(ev1, b2);
        }
        return ev2;
      } else if (a1_between) {
        if (!a2_equ_b2) {
          // make a2 equal to b2
          if (a2_between) {
            //         (a1)---(a2)
            //  (b1)-----------------(b2)
            this.eventDivide(ev2, a2);
          } else {
            //         (a1)----------(a2)
            //  (b1)----------(b2)
            this.eventDivide(ev1, b2);
          }
        }

        //         (a1)---(a2)
        //  (b1)----------(b2)
        this.eventDivide(ev2, a1);
      }
    } else {
      // otherwise, lines intersect at i.pt, which may or may not be between the endpoints

      // is A divided between its endpoints? (exclusive)
      if (i.alongA == 0) {
        if (i.alongB == -1) {
          // yes, at exactly b1
          this.eventDivide(ev1, b1);
        } else if (i.alongB == 0) {
          // yes, somewhere between B's endpoints
          this.eventDivide(ev1, i.point);
        } else if (i.alongB == 1) {
          // yes, at exactly b2
          this.eventDivide(ev1, b2);
        }
      }

      // is B divided between its endpoints? (exclusive)
      if (i.alongB == 0) {
        if (i.alongA == -1) {
          // yes, at exactly a1
          this.eventDivide(ev2, a1);
        } else if (i.alongA == 0) {
          // yes, somewhere between A's endpoints (exclusive)
          this.eventDivide(ev2, i.point);
        } else if (i.alongA == 1) {
          // yes, at exactly a2
          this.eventDivide(ev2, a2);
        }
      }
    }
    return null;
  }

  checkBothIntersections(
    ev: EventNode,
    above: EventNode | null,
    below: EventNode | null,
  ): EventNode | null {
    if (above != null) {
      const eve = this.checkIntersection(ev, above);
      if (eve != null) {
        return eve;
      }
    }
    if (below != null) {
      return this.checkIntersection(ev, below);
    }
    return null;
  }

  calculate_NO_SI(primaryPolyInverted: boolean, secondaryPolyInverted: boolean): Segment[] {
    // if selfIntersection is true then there is no secondary polygon, so that isn't used

    this.status_head = null;
    const segments = [];
    const surrounding = new Transition();

    while (this.event_head != null) {
      const ev = this.event_head;
      if (ev.isStart) {
        this.findStatusTransition(ev, surrounding);
        const above = surrounding.prev != null ? surrounding.prev.ev : null;
        const below = surrounding.here != null ? surrounding.here.ev : null;

        const eve = this.checkBothIntersections(ev, above, below);
        if (eve != null) {
          // ev and eve are equal
          // we'll keep eve and throw away ev

          // merge ev.seg's fill information into eve.seg

          // merge two segments that belong to different polygons
          // each segment has distinct knowledge, so no special logic is needed
          // note that this can only happen once per segment in this phase, because we
          // are guaranteed that all self-intersections are gone
          // 					eve.seg.otherFill = ev.seg.myFill;
          eve.seg.fill = fill_copyToOther(ev.seg.fill);

          this.removeNode(ev.other!);
          this.removeNode(ev);
        }

        if (this.event_head != ev) {
          // something was inserted before us in the event queue, so loop back around and
          // process it before continuing
          continue;
        }

        //
        // calculate fill flags
        //

        // now we fill in any missing transition information, since we are all-knowing
        // at this point

        if (fill_isOtherUndefined(ev.seg.fill)) {
          // if we don't have other information, then we need to figure out if we're
          // inside the other polygon
          let inside: boolean;
          if (below == null) {
            // if nothing is below us, then we're inside if the other polygon is
            // inverted
            inside = ev.primary ? secondaryPolyInverted : primaryPolyInverted;
          } else {
            // otherwise, something is below us
            // so copy the below segment's other polygon's above
            if (ev.primary == below.primary) {
              inside = (below.seg.fill & FILL_OTHER_ABOVE) != 0;
            } else {
              inside = (below.seg.fill & FILL_ABOVE) != 0;
            }
          }
          ev.seg.fill = fill_setOtherDefined(ev.seg.fill);
          if (inside) {
            ev.seg.fill = ev.seg.fill | FILL_MASK_OTHER;
          }
        }

        // insert the status and remember it for later removal
        ev.other!.status = this.insertStatus(surrounding, ev);
      } else {
        const st = ev.status;

        if (st == null) {
          throw new Error(
            'PolyBool: Zero-length segment detected; your epsilon is ' +
              'probably too small or too large',
          );
        }

        // removing the status will create two new adjacent edges, so we'll need to check
        // for those
        if (st.prev != null && st.next != null) {
          this.checkIntersection(st.prev.ev, st.next.ev);
        }

        // remove the status
        this.removeStatus(st);

        // if we've reached this point, we've calculated everything there is to know, so
        // save the segment for reporting
        if (!ev.primary) {
          // make sure `seg.myFill` actually points to the primary polygon though
          ev.seg.fill = fill_flip(ev.seg.fill);
        }
        segments.push(ev.seg);
      }

      // remove the event and continue
      this.event_head = this.removeHead(this.event_head);
    }

    return segments;
  }

  calculate_SI(primaryPolyInverted: boolean, secondaryPolyInverted: boolean): Segment[] {
    // if selfIntersection is true then there is no secondary polygon, so that isn't used

    this.status_head = null;
    const segments = [];
    const surrounding = new Transition();

    while (this.event_head != null) {
      const ev = this.event_head;
      if (ev.isStart) {
        this.findStatusTransition(ev, surrounding);
        const above = surrounding.prev != null ? surrounding.prev.ev : null;
        const below = surrounding.here != null ? surrounding.here.ev : null;

        const eve = this.checkBothIntersections(ev, above, below);
        if (eve != null) {
          // ev and eve are equal
          // we'll keep eve and throw away ev

          // merge ev.seg's fill information into eve.seg

          // are we a toggling edge?
          // 					var toggle = !ev.seg.myFill.belowIsDefined || ev.seg.myFill.above != ev.seg.myFill.below;

          // merge two segments that belong to the same polygon
          // think of this as sandwiching two segments together, where `eve.seg` is
          // the bottom -- this will cause the above fill flag to toggle
          if (fill_checkToggle(ev.seg.fill)) {
            // 						eve.seg.myFill = eve.seg.myFill.setAbove(!eve.seg.myFill.above);
            eve.seg.fill = fill_toggleAbove(eve.seg.fill);
          }

          this.removeNode(ev.other!);
          this.removeNode(ev);
        }

        if (this.event_head != ev) {
          // something was inserted before us in the event queue, so loop back around and
          // process it before continuing
          continue;
        }

        // if we are a new segment...
        // then we toggle
        // we are a segment that has previous knowledge from a division
        // calculate toggle
        // 				var toggle = !ev.seg.myFill.belowIsDefined || ev.seg.myFill.above != ev.seg.myFill.below; // are we a toggling edge?
        const toggle = fill_checkToggle(ev.seg.fill);

        // next, calculate whether we are filled below us
        // 				if (below == null) { // if nothing is below us...
        // 					// we are filled below us if the polygon is inverted
        // 					ev.seg.myFill = ev.seg.myFill.setBelow(primaryPolyInverted);
        // 				}
        // 				else {
        // 					// otherwise, we know the answer -- it's the same if whatever is below
        // 					// us is filled above it
        // 					ev.seg.myFill = ev.seg.myFill.setBelow(below.seg.myFill.above);
        // 				}

        ev.seg.fill = fill_setBelow(
          ev.seg.fill,
          below == null ? primaryPolyInverted : (below.seg.fill & FILL_ABOVE) != 0,
        );

        // since now we know if we're filled below us, we can calculate whether
        // we're filled above us by applying toggle to whatever is below us
        const is_below = (ev.seg.fill & FILL_BELOW) != 0;
        ev.seg.fill = fill_setAbove(ev.seg.fill, toggle ? !is_below : is_below);

        // insert the status and remember it for later removal
        ev.other!.status = this.insertStatus(surrounding, ev);
      } else {
        const st = ev.status;

        if (st == null) {
          throw new Error(
            'PolyBool: Zero-length segment detected; your epsilon is ' +
              'probably too small or too large',
          );
        }

        // removing the status will create two new adjacent edges, so we'll need to check
        // for those
        if (st.prev != null && st.next != null) {
          this.checkIntersection(st.prev.ev, st.next.ev);
        }

        // remove the status
        this.removeStatus(st);

        // if we've reached this point, we've calculated everything there is to know, so
        // save the segment for reporting
        if (!ev.primary) {
          // make sure `seg.myFill` actually points to the primary polygon though
          ev.seg.fill = fill_flip(ev.seg.fill);
        }
        segments.push(ev.seg);
      }

      // remove the event and continue
      this.event_head = this.removeHead(this.event_head);
    }

    return segments;
  }

  calculateNoSelfIntersection(
    segments1: Segment[],
    inverted1: boolean,
    segments2: Segment[],
    inverted2: boolean,
  ): Segment[] {
    // performing combination of polygons, so only deal with already-processed segments

    // segmentsX come from the self-intersection API, or this API
    // invertedX is whether we treat that list of segments as an inverted polygon or not
    // returns segments that can be used for further operations
    for (const seg of segments1) {
      this.eventAddSegment(seg, true);
    }
    for (const seg of segments2) {
      this.eventAddSegment(seg, false);
    }
    return this.calculate_NO_SI(inverted1, inverted2);
  }

  calculateWithSelfIntersection(inverted: boolean): Segment[] {
    return this.calculate_SI(inverted, false);
  }

  // otherwise, performing self-intersection, so deal with regions
  addRegion(region: Region) {
    // regions are a list of points:
    //  [ [0, 0], [100, 0], [50, 100] ]
    // you can add multiple regions before running calculate
    let pt1: Vector2;
    let pt2: Vector2 = region[region.length - 1];
    for (let i = 0; i < region.length; ++i) {
      pt1 = pt2;
      pt2 = region[i];

      const forward = pointsCompare(pt1, pt2);
      if (forward == 0) {
        // points are equal, so we have a zero-length segment
        continue;
      } // just skip it

      this.eventAddSegment(
        new Segment(forward < 0 ? pt1 : pt2, forward < 0 ? pt2 : pt1, FILL_NULL),
        true,
      );
    }
  }

  /// list
  removeNode(node: EventNode) {
    if (node.prev != null) {
      node.prev.next = node.next;
    } else {
      this.event_head = node.next;
    }

    if (node.next != null) {
      node.next.prev = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  removeHead(head: EventNode | null): EventNode | null {
    if (head != null) {
      const next = head.next;
      if (next != null) {
        next.prev = null;
        head.next = null;
      }
      head = next;
    }
    return head;
  }

  insertNodeBefore(ev: EventNode, other_pt: Vector2) {
    let prev: EventNode | null = null;
    let here = this.event_head;
    const p1_isStart = ev.isStart;
    const p1_1 = ev.pt;
    while (here != null) {
      if (
        Intersecter.eventLess(p1_isStart, p1_1, other_pt, here.isStart, here.pt, here.other!.pt)
      ) {
        break;
      }
      prev = here;
      here = here.next;
    }
    if (prev != null) {
      prev.next = ev;
    } else {
      this.event_head = ev;
    }
    if (here != null) {
      here.prev = ev;
    }
    ev.prev = prev;
    ev.next = here;
  }

  /// status list
  findStatusTransition(ev: EventNode, outTransition: Transition) {
    let here = this.status_head;
    let prev: StatusNode | null = null;
    const a1x = ev.seg.start.x;
    const a1y = ev.seg.start.y;
    const a2x = ev.seg.end.x;
    const a2y = ev.seg.end.y;
    while (here != null) {
      const b1 = here.ev.seg.start;
      const b2 = here.ev.seg.end;
      const b1x = b1.x;
      const b1y = b1.y;
      const b2x = b2.x;
      const b2y = b2.y;

      let dx1 = a1x - b1x;
      let dy1 = a1y - b1y;
      const dx2 = b1x - b2x;
      const dy2 = b1y - b2y;

      if (Math.abs(dx1 * dy2 - dx2 * dy1) < EPSILON) {
        dx1 = a2x - b1x;
        dy1 = a2y - b1y;
        if (
          Math.abs(dx1 * dy2 - dx2 * dy1) < EPSILON ||
          (b2y - b1y) * (a2x - b1x) - (b2x - b1x) * (a2y - b1y) < EPSILON
        ) {
          break;
        }
      } else if ((b2y - b1y) * (a1x - b1x) - (b2x - b1x) * (a1y - b1y) < EPSILON) {
        break;
      }

      prev = here;
      here = here.next;
    }

    outTransition.here = here;
    outTransition.prev = prev;
  }

  removeStatus(node: StatusNode) {
    if (node.prev != null) {
      node.prev.next = node.next;
    } else {
      this.status_head = node.next;
    }
    if (node.next != null) {
      node.next.prev = node.prev;
    }
    node.prev = null;
    node.next = null;
  }
  insertStatus(transition: Transition, ev: EventNode): StatusNode {
    const node = new StatusNode(ev);

    node.prev = transition.prev;
    node.next = transition.here;
    if (transition.prev != null) {
      transition.prev.next = node;
    } else {
      this.status_head = node;
    }

    if (transition.here != null) {
      transition.here.prev = node;
    }

    return node;
  }
}
