const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.detail || data?.error || "Backend request failed";
    throw new Error(message);
  }
  return data;
}

export async function getBackend<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleResponse(response) as Promise<T>;
}

export async function postBackend<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response) as Promise<T>;
}

export async function deleteBackend<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleResponse(response) as Promise<T>;
}
