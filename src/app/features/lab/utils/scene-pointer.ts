export interface ScenePointerHandlers {
  onMove: (event: PointerEvent) => void;
  onLeave?: () => void;
}

export interface ScenePointerBinding {
  unbind: () => void;
}

/**
 * Binds pointer tracking on a demo scene for mouse and touch.
 * pointerdown — initial touch position; pointerup/cancel — deactivation on touch end.
 */
export function bindScenePointer(
  element: HTMLElement,
  handlers: ScenePointerHandlers,
  options: { passive?: boolean } = {},
): ScenePointerBinding {
  const passive = options.passive ?? true;
  const listenerOptions: AddEventListenerOptions | undefined = passive ? { passive: true } : undefined;
  const onLeave = handlers.onLeave ?? (() => {});

  const onMove: EventListener = (event) => {
    handlers.onMove(event as PointerEvent);
  };

  const onPointerEnd: EventListener = (event) => {
    if ((event as PointerEvent).pointerType !== 'mouse') {
      onLeave();
    }
  };

  element.addEventListener('pointerdown', onMove, listenerOptions);
  element.addEventListener('pointermove', onMove, listenerOptions);
  element.addEventListener('pointerleave', onLeave);
  element.addEventListener('pointerup', onPointerEnd);
  element.addEventListener('pointercancel', onPointerEnd);

  return {
    unbind: () => {
      element.removeEventListener('pointerdown', onMove);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      element.removeEventListener('pointerup', onPointerEnd);
      element.removeEventListener('pointercancel', onPointerEnd);
    },
  };
};
