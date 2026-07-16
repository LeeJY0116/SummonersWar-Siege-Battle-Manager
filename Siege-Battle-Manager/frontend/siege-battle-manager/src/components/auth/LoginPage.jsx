import { useState } from "react";
import { login, signup } from "../../lib/auth";

const ROLE_OPTIONS = {
  master: {
    label: "길드장 가입",
    title: "길드장 가입 신청",
    description: "관리자 승인 후 길드가 생성되고 로그인할 수 있습니다.",
  },
  member: {
    label: "길드원 가입",
    title: "길드원 가입 신청",
    description: "길드장 또는 부길드장 승인 후 로그인할 수 있습니다.",
  },
};

export default function LoginPage() {
  const [view, setView] = useState("login");
  const [signupType, setSignupType] = useState("member");
  const [loginId, setLoginId] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [guildName, setGuildName] = useState("");
  const [gameNickname, setGameNickname] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notice, setNotice] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = view === "signup";
  const selectedSignup = ROLE_OPTIONS[signupType];

  function resetForm() {
    setLoginId("");
    setPw("");
    setConfirmPw("");
    setGuildName("");
    setGameNickname("");
    setContactEmail("");
    setLoginError("");
    setNotice(null);
  }

  function startSignup(type) {
    resetForm();
    setSignupType(type);
    setView("signup");
  }

  function showLogin() {
    resetForm();
    setView("login");
  }

  function showStart() {
    resetForm();
    setView("start");
  }

  function changeSignupType(type) {
    resetForm();
    setSignupType(type);
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setNotice(null);
    setLoginError("");

    if (!loginId || !pw) {
      setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      await login(loginId, pw);
      window.location.href = "/";
    } catch (e) {
      setLoginError(e.message || "아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (!loginId || !pw || !confirmPw || !guildName || !gameNickname || !contactEmail) {
      showNotice("아이디, 비밀번호, 길드 이름, 인게임 닉네임, 이메일을 모두 입력해주세요.", "error");
      return;
    }

    if (pw !== confirmPw) {
      showNotice("비밀번호가 일치하지 않습니다.", "error");
      return;
    }

    try {
      setLoading(true);
      await signup({
        loginId,
        email: contactEmail,
        password: pw,
        nickname: gameNickname,
        signupType,
        guildName,
      });

      showNotice(getSignupSuccessMessage(signupType), "success");
      setView("login");
      setLoginId("");
      setPw("");
      setConfirmPw("");
      setGuildName("");
      setGameNickname("");
      setContactEmail("");
    } catch (e) {
      showNotice(e.message || "회원가입 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  function showNotice(message, type = "info") {
    setNotice({ message, type });
  }

  function getSignupSuccessMessage(type) {
    if (type === "master") {
      return "길드장 가입 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.";
    }

    return "길드원 가입 신청이 접수되었습니다. 길드장 또는 부길드장 승인 후 로그인할 수 있습니다.";
  }

  return (
    <div
      className={`bg-[#120c09] px-3 py-3 text-slate-950 ${
        view === "login" ? "h-dvh overflow-hidden" : "min-h-dvh overflow-auto"
      }`}
    >
      {notice && <Toast notice={notice} onClose={() => setNotice(null)} />}

      <div
        className={`mx-auto flex w-full max-w-md ${
          view === "login" ? "h-full items-center" : "min-h-[calc(100dvh-1.5rem)] items-start py-4"
        }`}
      >
        <div className="w-full rounded-2xl border border-[#8b6a2e] bg-[#f8f7f5] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:p-8">
          {view === "start" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">계정 시작</p>
                <h2 className="text-2xl font-bold">가입 유형을 선택해주세요</h2>
                <p className="text-sm leading-6 text-slate-500">
                  길드장은 관리자 승인 후 길드를 관리하고,
                  길드원은 길드장 또는 부길드장 승인 후 참여할 수 있습니다.
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => startSignup("master")}
                  className="rounded-md border border-slate-300 px-4 py-4 text-left transition hover:border-slate-950 hover:bg-slate-50"
                >
                  <span className="block text-sm font-semibold">길드장 가입</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    관리자 승인 후 길드가 생성됩니다.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startSignup("member")}
                  className="rounded-md border border-slate-300 px-4 py-4 text-left transition hover:border-slate-950 hover:bg-slate-50"
                >
                  <span className="block text-sm font-semibold">길드원 가입</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    기존 길드에 가입 승인을 요청합니다.
                  </span>
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
                기존 계정이 있다면{" "}
                <button
                  type="button"
                  onClick={showLogin}
                  className="font-semibold text-slate-950 underline underline-offset-4"
                >
                  로그인
                </button>
              </div>
            </div>
          )}

          {view === "login" && (
            <AuthFormFrame
              title="로그인"
              description="SW 점령전 관리 도구에 접속합니다."
              onSubmit={handleLogin}
            >
              <TextField
                label="아이디"
                value={loginId}
                onChange={setLoginId}
                placeholder="아이디"
              />
              <PasswordField value={pw} onChange={setPw} label="비밀번호" />

              <p className="min-h-5 text-sm font-medium text-red-600">
                {loginError}
              </p>

              <button
                className="rounded-xl bg-[#4359f5] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#3147e0] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={loading}
                type="submit"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

              <AuthSwitch>
                계정이 없나요?{" "}
                <button
                  type="button"
                  onClick={showStart}
                  className="font-semibold text-[#4359f5] underline underline-offset-4"
                >
                  가입
                </button>
              </AuthSwitch>
            </AuthFormFrame>
          )}

          {isSignup && (
            <AuthFormFrame
              title={selectedSignup.title}
              description={selectedSignup.description}
              onSubmit={handleSignup}
            >
              <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
                {Object.entries(ROLE_OPTIONS).map(([type, option]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => changeSignupType(type)}
                    className={`rounded px-3 py-2 text-sm font-semibold transition ${
                      signupType === type
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <TextField
                label="아이디"
                value={loginId}
                onChange={setLoginId}
                placeholder="아이디"
              />
              <PasswordField value={pw} onChange={setPw} label="비밀번호" />
              <PasswordField value={confirmPw} onChange={setConfirmPw} label="비밀번호 확인" />

              <TextField
                label="길드 이름"
                value={guildName}
                onChange={setGuildName}
                placeholder={signupType === "master" ? "생성할 길드 이름" : "가입할 길드 이름"}
              />

              <TextField
                label="인게임 닉네임"
                value={gameNickname}
                onChange={setGameNickname}
                placeholder="인게임 닉네임"
              />

              <TextField
                label="이메일"
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="approval@example.com"
                type="email"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#4359f5] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#3147e0] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "가입 중..." : "회원가입"}
              </button>

              <AuthSwitch>
                기존 계정이 있다면{" "}
                <button
                  type="button"
                  onClick={showLogin}
                  className="font-semibold text-slate-950 underline underline-offset-4"
                >
                  로그인
                </button>
              </AuthSwitch>
            </AuthFormFrame>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthFormFrame({ title, description, onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold text-slate-500">계정</p>
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </form>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="space-y-1 text-base font-semibold text-slate-700">
      {label}
      <input
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function PasswordField({ label, value, onChange }) {
  return (
    <label className="space-y-1 text-base font-semibold text-slate-700">
      {label}
      <input
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-900"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </label>
  );
}

function AuthSwitch({ children }) {
  return (
    <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

function Toast({ notice, onClose }) {
  const isError = notice.type === "error";

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-4 text-sm shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className={isError ? "font-medium text-red-600" : "font-medium text-slate-900"}>
          {notice.message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 transition hover:text-slate-900"
          aria-label="알림 닫기"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
