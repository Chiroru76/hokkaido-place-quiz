import { ref } from "vue";

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

  return {
    elapsedTime,
    start,
  };
}
