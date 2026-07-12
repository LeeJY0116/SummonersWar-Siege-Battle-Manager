import React from "react";
import GuildMemberApprovalPanel from "./GuildMemberApprovalPanel.jsx";

const ROLE_LABELS = {
  MASTER: "Master",
  SUB_MASTER: "Sub Master",
  MEMBER: "Member",
};

export default function GuildMemberManagementTab({ members, onRefreshMembers }) {
  const realMembers = (members ?? []).filter((member) => member.realUser);

  return (
    <div className="space-y-4">
      <GuildMemberApprovalPanel onApproved={onRefreshMembers} />

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
          <h3 className="text-lg font-bold text-gray-950">길드 멤버</h3>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            활성 {realMembers.length}명
          </span>
        </div>

        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">닉네임 / ID</th>
                <th className="px-4 py-3">등급</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">등급 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {realMembers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>
                    활성 길드원이 없습니다.
                  </td>
                </tr>
              ) : (
                realMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-950">{member.displayName}</div>
                      <div className="text-xs text-gray-500">{member.loginId ?? `user-${member.userId}`}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{member.status ?? "APPROVED"}</td>
                    <td className="px-4 py-4 text-gray-400">-</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
