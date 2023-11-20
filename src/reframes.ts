export const resize = (mode: 'cover', content: Size, container: Size) => {
  'worklet';
  const {width, height} = container;

  const aspectRatio = width / height;

  const [frameWidth, frameHeight] = [content.width, content.height];

  const frameAspectRatio = frameWidth / frameHeight;

  let widthRatio: number;
  let heightRatio: number;
  let offsetX = 0;
  let offsetY = 0;
  if (frameAspectRatio < aspectRatio) {
    widthRatio = width / frameWidth;
    const croppedFrameHeight = frameWidth / aspectRatio;
    offsetY = (frameHeight - croppedFrameHeight) / 2;
    heightRatio = height / croppedFrameHeight;
  } else {
    heightRatio = height / frameHeight;
    const croppedFrameWidth = aspectRatio * frameHeight;
    offsetX = (frameWidth - croppedFrameWidth) / 2;
    widthRatio = width / croppedFrameWidth;
  }

  return {
    adjustPoint(point: Point2D): Point2D {
      return {
        x: (point.x - offsetX) * widthRatio,
        y: (point.y - offsetY) * heightRatio,
      };
    },
    adjustRect(rect: Rect): Rect {
      return {
        top: (rect.top - offsetY) * heightRatio,
        left: (rect.left - offsetX) * widthRatio,
        height: rect.height * heightRatio,
        width: rect.width * widthRatio,
      };
    },
  };
};

export const mirror = (
  direction: 'horizontal' | 'vertical',
  container: Size,
) => {
  'worklet';

  return direction === 'horizontal'
    ? {
        adjustPoint(point: Point2D): Point2D {
          const {x, y} = point;
          return {x: container.width - x, y};
        },
        adjustRect(rect: Rect): Rect {
          return {
            ...rect,
            left: container.width - rect.left - rect.width,
          };
        },
      }
    : {
        adjustPoint(point: Point2D): Point2D {
          const {x, y} = point;
          return {x, y: container.height - y};
        },
        adjustRect(rect: Rect): Rect {
          return {
            ...rect,
            top: container.height - rect.top - rect.height,
          };
        },
      };
};
