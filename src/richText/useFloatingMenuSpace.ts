import { useLayoutEffect, type RefObject } from 'react';

export function useFloatingMenuSpace(
  container: RefObject<HTMLDivElement | null>,
  controls: RefObject<HTMLDivElement | null>,
  mounted: boolean,
) {
  useLayoutEffect(() => {
    const root = container.current,
      footer = controls.current;
    if (!root || !footer) return;
    const measure = () => {
      // Absolute menus do not resize the writing area. Recalculate only when
      // keyboard/orientation/font scaling changes the container or toolbar size.
      footer.style.setProperty(
        '--menu-height',
        `${Math.max(0, root.clientHeight - footer.offsetHeight - 16)}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [container, controls, mounted]);
}
