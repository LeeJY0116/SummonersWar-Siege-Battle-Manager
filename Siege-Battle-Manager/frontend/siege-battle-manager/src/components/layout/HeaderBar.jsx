import React from "react";

export default function HeaderBar({
  activeTab,
  onChangeTab,
  onClickImport,
  onClickExport,
  importInputRef,
  onImportFile,
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Siege-Battle-Manager
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          점령전 조합 · 전투 기록 보조 도구
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        {/* 탭 */}
        <div className="inline-flex rounded-2xl bg-gray-100 p-1 gap-1 self-end">
          <button
            onClick={() => onChangeTab("manager")}
            className={`px-3 py-1 rounded-xl text-sm ${
              activeTab === "manager"
                ? "bg-white shadow font-semibold"
                : "text-gray-500"
            }`}
          >
            조합 매니저
          </button>
          <button
            onClick={() => onChangeTab("siege")}
            className={`px-3 py-1 rounded-xl text-sm ${
              activeTab === "siege"
                ? "bg-white shadow font-semibold"
                : "text-gray-500"
            }`}
          >
            점령전
          </button>
        </div>

        {/* Import / Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClickImport}
            className="px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm hover:bg-gray-100"
          >
            설정 불러오기 (Import)
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await onImportFile(f);
              e.target.value = "";
            }}
            className="hidden"
          />
          <button
            onClick={onClickExport}
            className="px-4 py-2 rounded-2xl bg-gray-900 text-white shadow hover:opacity-90"
          >
            설정 내보내기 (Export)
          </button>
        </div>
      </div>
    </header>
  );
}
