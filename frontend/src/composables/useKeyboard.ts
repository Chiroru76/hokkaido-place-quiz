import { onMounted, onUnmounted } from "vue";

/**
 * キーボードイベントハンドラーの型
 * KeyboardEventを受け取ることで、修飾キー（Cmd/Ctrl）などの情報にアクセスできる
 */
type KeyHandler = (event: KeyboardEvent) => void;
type KeyHandlerMap = Record<string, KeyHandler>;

/**
 * キーボードショートカットを管理するcomposable
 *
 * @param handlers - キーとハンドラーのマップ
 *
 * @example
 * useKeyboard({
 *   Enter: (event) => {
 *     // Cmd+Enter または Ctrl+Enter で送信
 *     if (event.metaKey || event.ctrlKey) {
 *       submit();
 *     }
 *   }
 * });
 */
export function useKeyboard(handlers: KeyHandlerMap) {
  const onKeydown = (event: KeyboardEvent) => {
    const handler = handlers[event.key];
    if (!handler) return;
    handler(event);
  };

  onMounted(() => {
    window.addEventListener("keydown", onKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
  });

  return {};
}
