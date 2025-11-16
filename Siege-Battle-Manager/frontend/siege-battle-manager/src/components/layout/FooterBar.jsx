import React from "react";

export default function FooterBar() {
  return (
    <footer className="mt-8 text-xs text-gray-500">
      <p>
        ⚙️ 데이터는 자동으로 브라우저에 저장되며(로컬 스토리지), 상단의
        Import/Export로 백업/복원할 수 있습니다. 이미지 파일은 JSON 내부에
        base64로 포함됩니다.
      </p>
    </footer>
  );
}
