import React, { useState } from "react";
import { signup } from "../../lib/auth.js";

export default function SignupPage({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password || !nickname) {
      alert("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      await signup({
        email,
        password,
        nickname,
      });

      alert("회원가입이 완료되었습니다. 로그인해주세요.");
      onBackToLogin();
    } catch (e) {
      console.error(e);
      alert(e.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">회원가입</h1>

        <input
          className="w-full border rounded-xl px-3 py-2"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded-xl px-3 py-2"
          placeholder="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="w-full border rounded-xl px-3 py-2"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-2 disabled:bg-gray-400"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-sm text-gray-600 underline"
        >
          로그인으로 돌아가기
        </button>
      </form>
    </div>
  );
}