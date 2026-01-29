import { onMounted, ref } from "vue";
import type { MunicipalityTrivia } from "../types/trivia";

export function useMunicipalityTrivia() {
  const triviaData = ref<MunicipalityTrivia>({});
  const loading = ref(true);

  onMounted(async () => {
    try {
      const response = await fetch("/data/municipality-trivia.json");
      triviaData.value = await response.json();
    } catch (error) {
      console.error("Failed to load trivia data:", error);
    } finally {
      loading.value = false;
    }
  });

  const getTrivia = (municipalityName: string): string => {
    return triviaData.value[municipalityName] || "";
  };

  return {
    getTrivia,
    loading,
  };
}
