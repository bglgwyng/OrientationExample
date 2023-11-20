import {BehaviorSubject} from 'rxjs';
import {
  SharedValue,
  cancelAnimation,
  makeMutable,
  withTiming,
} from 'react-native-reanimated';
import {imageSize} from './utils/frameInfo';
import {mirror, resize} from './utils/reframes';

export class TrackedFace {
  trackingId: string;
  animatedBounds: SharedValue<Face['bounds']>;
  frameInfo: FrameInfo;

  constructor(face: Face, frameInfo: FrameInfo) {
    this.trackingId = face.trackingId.toString();
    this.animatedBounds = makeMutable(face.bounds);
    this.frameInfo = frameInfo;
  }

  next = (face: Face, frameInfo: FrameInfo) => {
    this.animatedBounds.value = withTiming(face.bounds, {duration: 100});
    this.frameInfo = frameInfo;
  };

  dispose = () => {
    cancelAnimation(this.animatedBounds);
  };
}

// export const trackedFacesState = state(
//   (faceTracker: FaceTracker) => faceTracker.observable,
//   [],
// );

class FaceTracker {
  private viewSize: Size;
  private isMirrored: boolean;
  private trackedFaces = new Map<string, TrackedFace>();
  public subject = new BehaviorSubject<TrackedFace[]>([]);
  public observable = this.subject.asObservable();

  constructor(viewSize: Size, isMirrored: boolean) {
    this.viewSize = viewSize;
    this.isMirrored = isMirrored;
    // this.subject.next([]);
  }

  next = (faces: Face[], frameInfo: FrameInfo) => {
    const {adjustRect} = resize('cover', imageSize(frameInfo), this.viewSize);

    let hasChanges = false;

    const keepTrackedFaceIds = new Set<string>();
    const newlyTrackedFaces: TrackedFace[] = [];

    for (const face of faces) {
      const trackingId = face.trackingId.toString();

      let bounds = adjustRect(face.bounds);
      if (this.isMirrored) {
        bounds = mirror('horizontal', this.viewSize).adjustRect(bounds);
      }

      const adjustedFace: Face = {...face, bounds};

      const oldFace = this.trackedFaces.get(trackingId);

      if (oldFace === undefined) {
        newlyTrackedFaces.push(new TrackedFace(adjustedFace, frameInfo));

        hasChanges ||= true;
      } else {
        oldFace.next(adjustedFace, frameInfo);
        keepTrackedFaceIds.add(trackingId);
      }
    }

    for (const [trackingId, face] of this.trackedFaces) {
      if (!keepTrackedFaceIds.has(trackingId)) {
        face.dispose();
        this.trackedFaces.delete(trackingId);

        hasChanges ||= true;
      }
    }

    for (const i of newlyTrackedFaces) {
      this.trackedFaces.set(i.trackingId, i);
    }

    if (hasChanges) {
      const newTrackedFaces = Array.from(this.trackedFaces.values());
      newTrackedFaces.sort();

      this.subject.next(newTrackedFaces);
    }
  };
}

export default FaceTracker;
