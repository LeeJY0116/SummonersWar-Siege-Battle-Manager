import React, { useEffect } from "react";

const HELP_SECTIONS = [
  {
    title: "계정과 가입",
    items: [
      "길드장 가입은 관리자 승인 후 로그인할 수 있습니다.",
      "길드원 가입은 길드장 또는 부길드장 승인 후 로그인할 수 있습니다.",
      "소속 길드가 없는 사용자는 길드 소속 뒤 기능 사용이 가능합니다.",
    ],
  },
  {
    title: "권한",
    items: [
      "길드장은 모든 길드원 인벤토리와 방덱을 관리할 수 있습니다.",
      "부길드장은 가입 승인, 더미 계정, 길드원 인벤토리와 방덱을 관리할 수 있습니다.",
      "길드원은 본인 인벤토리와 본인 방덱, 전투 연구를 사용할 수 있습니다.",
    ],
  },
  {
    title: "인벤토리와 방덱",
    items: [
      "인벤토리 수량은 몬스터별 0~10마리까지 저장됩니다.",
      "방덱은 길드원의 인벤토리를 기반으로 생성됩니다.",
      "방덱 생성에 사용된 몬스터는 인벤토리에서 차감됩니다."
    ],
  },
  {
    title: "길드 방덱",
    items: [
      "길드 공용으로 참고할 방덱 템플릿을 등록합니다.",
      "상세 보기에서 해당 방덱을 만들 수 있는 길드원을 확인합니다.",
      "탈퇴한 길드원은 생성 가능 길드원 계산에서 제외됩니다.",
    ],
  },
  {
    title: "전투 연구",
    items: [
      "방덱 공략과 공격 조합을 게시글과 댓글로 기록합니다.",
      "리더 효과, 포함 몬스터, 4성 방덱 필터 및 검색 기능으로 게시글을 찾을 수 있습니다.",
      "게시글과 댓글은 10개 단위로 표시되며, 작성은 30초에 한 번 가능합니다.",
    ],
  },
  {
    title: "회원 관리",
    items: [
      "길드장과 부길드장은 가입 요청 승인, 등급 변경, 추방을 처리합니다.",
      "더미 계정은 실제 로그인 없이 인벤토리와 방덱만 관리하는 가상 길드원입니다.",
      "더미 계정도 길드 인원으로 포함됩니다.",
    ],
  },
];

export default function HelpModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#a77a30] bg-[#241811] text-[#f6deb0] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#6d4a1e] bg-[#2f2118] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a96a]">
              도움말
            </p>
            <h2
              id="help-modal-title"
              className="mt-1 text-2xl font-extrabold text-[#fff0c8]"
            >
              SW 점령전 사용법
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#d7be80]">
              길드 운영, 인벤토리, 방덱, 전투 연구를 사용할 때 필요한 핵심 흐름입니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#9b743a] bg-[#1b120d] px-3 py-2 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[calc(86vh-132px)] overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {HELP_SECTIONS.map((section) => (
              <section
                key={section.title}
                className="rounded-xl border border-[#6d4a1e] bg-[#332216] p-4"
              >
                <h3 className="text-base font-bold text-[#ffe3a0]">
                  {section.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#f6deb0]">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f6c44f]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-[#8b6a2e] bg-[#1c120c] p-4 text-sm leading-6 text-[#d7be80]">
            좌측 상단에 탭별 간단한 설명이 첨부되어 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}
