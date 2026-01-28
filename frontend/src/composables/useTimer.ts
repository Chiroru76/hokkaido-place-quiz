import { computed, onUnmounted, ref } from "vue";

export function useTimer() {
  // 経過時間（秒）
  const elapsedTime = ref(0);

  // setInterval のIDを保持する変数
  let intervalId: number | null = null;

  // タイマー開始
  const start = () => {
    if (intervalId !== null) return;

    intervalId = window.setInterval(() => {
      elapsedTime.value += 1;
    }, 1000);
  };

  // タイマー停止
  const stop = () => {
    if (intervalId === null) return;

    clearInterval(intervalId);
    intervalId = null;
  };

  // タイマーをリセット
  const reset = () => {
    stop();
    elapsedTime.value = 0;
  };

  // MM:SS 表記に変換
  const formattedTime = computed(() => {
    const minutes = Math.floor(elapsedTime.value / 60);
    const seconds = elapsedTime.value % 60;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    return `${mm}:${ss}`;
  });

  onUnmounted(() => {
    stop();
  });

  return {
    elapsedTime,
    formattedTime,
    start,
    stop,
    reset,
  };
}
