import {
  useRef,
  useState,
  useEffect,
  RefObject,
  useCallback,
  MutableRefObject,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';

const MIN_SWIPE_DISTANCE = 150;

interface TouchCoordinates {
  x: number;
  y: number;
}

interface UseSwipeOptions<T extends HTMLElement = HTMLDivElement> {
  minSwipeDistance?: number;
  keepUpdatedState?: boolean;
  ref?: MutableRefObject<T>;
  useDocument?: boolean;
}

interface SwipeInfo {
  isSwipeLeft: boolean;
  isSwipeRight: boolean;
  isSwipeUp: boolean;
  isSwipeDown: boolean;
}

interface UseSwipe<T extends HTMLElement = HTMLDivElement> {
  ref: RefObject<T>;
  swipeInfo: SwipeInfo;
}

/**
 * useSwipe hook provides touch swipe detection functionality in React components.
 *
 * @remarks
 * This hook listens for touch events (touchstart, touchmove, touchend) on the specified element
 * and determines whether a swipe has occurred in various directions (left, right, up, down).
 *
 * @template T - The type of the HTML element reference. Defaults to `HTMLDivElement`.
 *
 * @param options - Optional configuration options for the hook.
 * @param options.minSwipeDistance - Minimum distance (in pixels) for a swipe to be considered. Defaults to `150`.
 * @param options.keepUpdatedState - Prevent resetting values to initial value after update.
 * @param options.ref - External ref, if not specified hook ref will be used.
 * @param options.useDocument - Apply the touch event listeners to document object instead of a single element,
 *  if specified, it takes precedence over all refs.
 *
 * @returns An object containing:
 * - `ref`: A React ref that should be attached to the target HTML element.
 * - `swipeInfo`: An object with boolean properties indicating swipe directions:
 *    - `isSwipeLeft`: A boolean indicating whether a left swipe has occurred.
 *    - `isSwipeRight`: A boolean indicating whether a right swipe has occurred.
 *    - `isSwipeUp`: A boolean indicating whether an upward swipe has occurred.
 *    - `isSwipeDown`: A boolean indicating whether a downward swipe has occurred.
 *
 * @example
 * ```tsx
 * import { useSwipe } from '@turnix/hooks';
 *
 * const YourComponent = () => {
 *   const [ref, { isSwipeLeft, isSwipeRight, isSwipeUp, isSwipeDown }] = useSwipe();
 *
 *   return (
      <div ref={ref}>Swipable element</div>
 *   );
 * };
 * ```
 */
export const useSwipe = <T extends HTMLElement = HTMLDivElement>(
  options?: UseSwipeOptions<T>,
): UseSwipe<T> => {
  const minSwipeDistance = options?.minSwipeDistance ?? MIN_SWIPE_DISTANCE;
  const ref = useRef<T>(null);
  const [touchStart, setTouchStart] = useState<TouchCoordinates | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchCoordinates | null>(null);
  const initialSwipeInfo = {
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
  };
  const [swipeInfo, setSwipeInfo] = useState<SwipeInfo>(initialSwipeInfo);

  const updateSwipeInfo = (deltaX: number, deltaY: number) => {
    setSwipeInfo({
      isSwipeLeft: deltaX > minSwipeDistance,
      isSwipeRight: deltaX < -minSwipeDistance,
      isSwipeUp: deltaY > minSwipeDistance,
      isSwipeDown: deltaY < -minSwipeDistance,
    });

    !options?.keepUpdatedState &&
      setTimeout(() => setSwipeInfo(initialSwipeInfo), 100);
  };

  const debouncedStateUpdate = useDebouncedCallback(updateSwipeInfo, 200);
  useEffect(() => () => debouncedStateUpdate.cancel(), [debouncedStateUpdate]);

  const onTouchStart = useCallback((e: globalThis.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchMove = useCallback((e: globalThis.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    debouncedStateUpdate(deltaX, deltaY);

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, debouncedStateUpdate]);

  useEffect(() => {
    if (options?.useDocument) {
      document.addEventListener('touchstart', onTouchStart);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);

      return () => {
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };
    }

    const swipableElement = options?.ref?.current ?? ref.current;

    if (swipableElement) {
      swipableElement.addEventListener('touchstart', onTouchStart);
      swipableElement.addEventListener('touchmove', onTouchMove);
      swipableElement.addEventListener('touchend', onTouchEnd);

      return () => {
        swipableElement.removeEventListener('touchstart', onTouchStart);
        swipableElement.removeEventListener('touchmove', onTouchMove);
        swipableElement.removeEventListener('touchend', onTouchEnd);
      };
    }

    return () => {}
  }, [
    ref,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    options?.ref,
    options?.useDocument,
  ]);

  return { ref, swipeInfo };
};
