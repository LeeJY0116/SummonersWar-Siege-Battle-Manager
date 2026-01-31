import { apiFetch } from "./api";

export async function login(email, password) {
  const res = await apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = res.data.accessToken;

  localStorage.setItem("accessToken", token);

  return res.data;
}
