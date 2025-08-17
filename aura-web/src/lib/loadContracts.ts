// Выбираем какой deployed-файл импортировать (локал / sepolia)
// VITE_NETWORK=sepolia → берём sepolia, иначе localhost
const net = import.meta.env.VITE_NETWORK === "sepolia" ? "sepolia" : "localhost";

// импорт работает, потому что файлы скопированы в src/generated
export async function loadDeployed() {
  if (net === "sepolia") {
    const json = await import("@generated/deployed_sepolia.json");
    return json.default;
  }
  const json = await import("@generated/deployed_localhost.json");
  return json.default;
}
