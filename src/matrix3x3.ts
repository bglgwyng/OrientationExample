export type Matrix3x3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const identity: Matrix3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const multiply = (m: Matrix3x3, n: Matrix3x3): Matrix3x3 => {
  'worklet';

  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = m;
  const [n00, n01, n02, n10, n11, n12, n20, n21, n22] = n;

  return [
    m00 * n00 + m01 * n10 + m02 * n20,
    m00 * n01 + m01 * n11 + m02 * n21,
    m00 * n02 + m01 * n12 + m02 * n22,
    m10 * n00 + m11 * n10 + m12 * n20,
    m10 * n01 + m11 * n11 + m12 * n21,
    m10 * n02 + m11 * n12 + m12 * n22,
    m20 * n00 + m21 * n10 + m22 * n20,
    m20 * n01 + m21 * n11 + m22 * n21,
    m20 * n02 + m21 * n12 + m22 * n22,
  ];
};

export const translate = (dx: number, dy: number): Matrix3x3 => {
  'worklet';

  return [1, 0, dx, 0, 1, dy, 0, 0, 1];
};

export const scale = (sx: number, sy: number): Matrix3x3 => {
  'worklet';

  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
};

export const rotate = (theta: number): Matrix3x3 => {
  'worklet';

  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  return [cosTheta, -sinTheta, 0, sinTheta, cosTheta, 0, 0, 0, 1];
};

export const applyToPoint = (m: Matrix3x3, v: Point): Point => {
  'worklet';

  const [m00, m01, m02, m10, m11, m12] = m;
  const {x, y} = v;
  return {
    x: m00 * x + m01 * y + m02,
    y: m10 * x + m11 * y + m12,
  };
};

export const applyToRect = (m: Matrix3x3, v: Rect): Rect => {
  'worklet';

  const {left, top, width, height} = v;

  const topLeft = {x: left, y: top};
  const bottomRight = {x: left + width, y: top + height};

  const transformedTopLeft = applyToPoint(m, topLeft);
  const transformedBottomRight = applyToPoint(m, bottomRight);

  const minX = Math.min(transformedTopLeft.x, transformedBottomRight.x);
  const minY = Math.min(transformedTopLeft.y, transformedBottomRight.y);
  const maxX = Math.max(transformedTopLeft.x, transformedBottomRight.x);
  const maxY = Math.max(transformedTopLeft.y, transformedBottomRight.y);

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};
