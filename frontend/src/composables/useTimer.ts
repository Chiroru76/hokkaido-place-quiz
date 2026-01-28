import { ref } from "vue";

export function useTimer() {
  const elapsedTime = ref(0);

  return {
    elapsedTime
  };
}
