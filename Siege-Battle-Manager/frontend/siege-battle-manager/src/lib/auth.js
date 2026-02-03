import { apiFetch } from "./api";

export async function login(email, password) {
  const res = await apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

    // ✅ 여기서 응답 구조에 맞게 추출
  const token =
    res?.data?.accessToken ??
    res?.data?.token ??
    res?.accessToken ??
    res?.token;

  if (!token) {
    console.log("login response:", res);
    throw new Error("로그인 응답에 accessToken이 없습니다.");
  }

  localStorage.setItem("accessToken", token);
  return res.data;
}
