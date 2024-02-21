import { useRef, useState, useEffect, RefObject } from 'react';

const MIN_SWIPE_DISTANCE = 50;

interface TouchCoordinates {
  x: number;
  y: number;
}

interface UseSwipeOptions {
  minSwipeDistance?: number;
}

interface SwipeInfo {
  isSwipeLeft: boolean;
  isSwipeRight: boolean;
  isSwipeUp: boolean;
  isSwipeDown: boolean;
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
 * @param options.minSwipeDistance - Minimum distance (in pixels) for a swipe to be considered.
 *
 * @returns An array containing:
 * - `ref`: A React ref that should be attached to the target HTML element.
 * - `swipeInfo`: An object with properties indicating the direction of the swipe.
 *   - `isSwipeLeft`: A boolean indicating whether a left swipe has occurred.
 *   - `isSwipeRight`: A boolean indicating whether a right swipe has occurred.
 *   - `isSwipeUp`: A boolean indicating whether an upward swipe has occurred.
 *   - `isSwipeDown`: A boolean indicating whether a downward swipe has occurred.
 *
 * @example
 * ```tsx
 * import { useSwipe } from '@turnix/hooks';
 *
 * const YourComponent = () => {
 *   const [ref, { isSwipeLeft, isSwipeRight, isSwipeUp, isSwipeDown }] = useSwipe();
 *
 *   return (
      <div ref={ref}>Swipable section</div>
 *   );
 * };
 * ```
 */
export const useSwipe = <T extends HTMLElement = HTMLDivElement>(
  options?: UseSwipeOptions,
): [RefObject<T>, SwipeInfo] => {
  const minSwipeDistance = options?.minSwipeDistance ?? MIN_SWIPE_DISTANCE;
  const ref = useRef<T>(null);
  const [touchStart, setTouchStart] = useState<TouchCoordinates | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchCoordinates | null>(null);
  const [swipeInfo, setSwipeInfo] = useState<SwipeInfo>({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
  });

  const onTouchStart = (e: globalThis.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: globalThis.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    setSwipeInfo({
      isSwipeLeft: deltaX > minSwipeDistance,
      isSwipeRight: deltaX < -minSwipeDistance,
      isSwipeUp: deltaY > minSwipeDistance,
      isSwipeDown: deltaY < -minSwipeDistance,
    });

    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    ref.current?.addEventListener('touchstart', onTouchStart);
    ref.current?.addEventListener('touchmove', onTouchMove);
    ref.current?.addEventListener('touchend', onTouchEnd);

    return () => {
      ref.current?.removeEventListener('touchstart', onTouchStart);
      ref.current?.removeEventListener('touchmove', onTouchMove);
      ref.current?.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, onTouchStart, onTouchMove, onTouchEnd]);

  return [ref, swipeInfo];
};
