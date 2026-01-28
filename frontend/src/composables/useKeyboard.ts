import { onMounted, onUnmounted } from "vue";

type KeyHandlerMap = Record<string, () => void>;

export function useKeyboard(handlers: KeyHandlerMap) {
  const onKeydown = (event: KeyboardEvent) => {
    const handler = handlers[event.key];
    if (!handler) return;
    handler();
  };

  onMounted(() => {
    window.addEventListener("keydown", onKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
  });

  return {};
}
