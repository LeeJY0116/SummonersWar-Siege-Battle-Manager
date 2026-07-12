import { apiFetch } from "./api";

export async function signup({ loginId, email, password, nickname, signupType, guildName }) {
  const res = await apiFetch("/users/signup", {
    method: "POST",
    body: JSON.stringify({
      loginId,
      email,
      password,
      nickname,
      signupType,
      guildName,
    }),
  });
}

export async function login(loginId, password) {
  const res = await apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  });

  const token =
    res?.data?.accessToken ??
    res?.data?.token ??
    res?.accessToken ??
    res?.token;

  if (!token) {
    console.log("login response:", res);
    throw new Error("로그인 응답에 토큰이 없습니다.");
  }

  localStorage.setItem("accessToken", token);
  return res.data;
}

export async function fetchMe() {
  const res = await apiFetch("/users/me");
  return res.data;
}
