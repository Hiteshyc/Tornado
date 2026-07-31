import { fetchWithAuth } from "../libs/api";

const API_BASE = 'http://localhost:5000/api'

export async function fetchDeployments() {
  const data = await fetchWithAuth(`${API_BASE}/deployments`, {
    method: "GET",
    credentials: "include",
  });
  return data.deployments;
}

export async function createDeployment(alertId: string) {
  const data = await fetchWithAuth(`${API_BASE}/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId }),
    credentials: "include",
  });
  return data.deployment;
}

export async function updateDeployment(id: string, patch: any) {
  const data = await fetchWithAuth(`${API_BASE}/deployments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    credentials: "include",
  });
  return data.deployment;
}
