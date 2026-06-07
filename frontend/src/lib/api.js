const API_URL = import.meta.env.VITE_API_URL || "/graphql";

export async function graphQLRequest(query, variables = {}) {
  let response;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });
  } catch {
    throw new Error("Unable to reach the server. Check that the API is running.");
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("json")) {
    throw new Error(`The server returned an unexpected response (${response.status}).`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map(error => error.message).join(". "));
  }

  if (!response.ok || !payload.data) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return payload.data;
}
