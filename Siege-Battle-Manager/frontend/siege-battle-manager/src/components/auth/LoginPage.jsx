import { useState } from "react";
import { login } from "../../lib/auth";

export default function LoginPage({ onLogin, onGoSignup}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, pw);
      window.location.href = "/";
    } catch (e) {
      alert("로그인 실패");
    }
  };

  return (
    <div className="p-8">
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="password" />
      <button onClick={handleLogin}>로그인</button>
      <button type="button" onClick={onGoSignup} className="w-full text-sm text-gray-600 underline">
      회원가입
      </button>
    </div>
  );
}
