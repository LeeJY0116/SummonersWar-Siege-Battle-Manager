import defaultMonsters from "../data/defaultMonsters.json";

// 🔥 지금은 JSON, 나중엔 API로 교체
export async function getMonsters() {
  return defaultMonsters;
}
