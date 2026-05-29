"use client";

import { useState } from "react";
import SelectableChip from "./SelectableChip";

interface AiScriptDrawerProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
}

// 대본 출력창 공통 컴포넌트
interface ResultBoxProps {
  resultText: string;
}
const ScriptResultBox = ({ resultText }: ResultBoxProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    alert("원고 대본이 클립보드에 성공적으로 복사되었습니다!");
  };

  return (
    <div className="mt-7 p-4 bg-neutral-950 rounded-xl border border-neutral-800 relative animate-fadeIn">
      <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-neutral-900">
        <h6 className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">
          AI 맞춤 대본 결과:
        </h6>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 rounded-md shadow transition"
        >
          전체 복사
        </button>
      </div>
      <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto pr-1 RegalScroll">
        {resultText}
      </p>
    </div>
  );
};

export default function AiScriptDrawer({
  isOpen,
  isClosing,
  onClose,
}: AiScriptDrawerProps) {
  const [activeTab, setActiveTab] = useState<"transform" | "create">(
    "transform"
  );
  const [scriptStyle, setScriptStyle] = useState("default");
  const [isScriptLoading, setIsScriptLoading] = useState(false);

  // tab 1: 자막 변환 전용 상태
  const [userRawScript, setUserRawScript] = useState("");
  const [transformResult, setTransformResult] = useState("");

  // tab 2: 제품 생성 전용 상태
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [createResult, setCreateResult] = useState("");

  const handleTabChange = (tab: "transform" | "create") => {
    setActiveTab(tab);
    setScriptStyle(tab === "transform" ? "default" : "funny");
  };

  const handleGenerateCustomScript = async () => {
    if (activeTab === "transform") setTransformResult("");
    if (activeTab === "create") setCreateResult("");

    if (activeTab === "transform" && !userRawScript.trim()) {
      alert("유튜브 자막 스크립트 내용을 먼저 붙여넣어 주세요!");
      return;
    }
    if (activeTab === "create" && !productName.trim()) {
      alert("기획안을 작성할 제품명 또는 서비스명을 입력해 주세요!");
      return;
    }

    setIsScriptLoading(true);

    try {
      const requestBody =
        activeTab === "transform"
          ? { mode: "transform", rawScript: userRawScript, style: scriptStyle }
          : { mode: "create", productName, productDesc, style: scriptStyle };

      const response = await fetch("/api/gemini/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        if (activeTab === "transform") {
          setTransformResult(data.result);
        } else {
          setCreateResult(data.result);
        }
      } else {
        alert(data.error || "대본 생성 도중 알 수 없는 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("AI Script Frontend Fetch Error:", error);
      alert("서버와 통신하는 도중 네트워크 연결 오류가 발생했습니다.");
    } finally {
      setIsScriptLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity ${
          isClosing ? "animate-fadeOut" : "animate-fadeIn"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 left-0 w-[420px] bg-neutral-900 border-r border-neutral-800 p-6 shadow-2xl overflow-y-auto z-50 text-white flex flex-col justify-between ${
          isClosing ? "animate-slideOutLeft" : "animate-slideInLeft"
        }`}
      >
        <div>
          {/* 상단 타이틀 바 */}
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-200 tracking-wide">
                AI 맞춤형 대본 생성기
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 세그먼트 탭 UI */}
          <div className="flex p-1 bg-neutral-950 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => handleTabChange("transform")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === "transform"
                  ? "bg-neutral-800 text-indigo-400 border border-neutral-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              자막 스크립트 변환
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("create")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === "create"
                  ? "bg-neutral-800 text-indigo-400 border border-neutral-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              제품 기반 숏츠 생성
            </button>
          </div>

          {/* 자막 스크립트 변환 레이아웃 */}
          {activeTab === "transform" && (
            <div className="animate-fadeIn">
              <p className="text-[11px] text-neutral-400 mb-4 pb-4 border-b border-neutral-800 leading-relaxed">
                유튜브 영상의 원본 자막을 복사해 넣으면 타임스탬프를 제거하고
                가독성 높은 맞춤형 원고로 정제합니다.
              </p>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-neutral-500 block mb-1.5 uppercase tracking-wider">
                  대본 스타일 선택
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "default", label: "기본 대본" },
                    { id: "shorts", label: "1분 숏츠" },
                  ].map((option) => (
                    <SelectableChip
                      key={option.id}
                      id={option.id}
                      label={option.label}
                      isSelected={scriptStyle === option.id}
                      onClick={() => setScriptStyle(option.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="relative mb-1">
                <textarea
                  value={userRawScript}
                  onChange={(e) => setUserRawScript(e.target.value)}
                  className="w-full h-44 p-3.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition resize-none leading-relaxed"
                  placeholder="유튜브 등에서 복사한 원본 자막 스크립트 텍스트를 여기에 붙여넣으세요..."
                />
                {userRawScript && (
                  <button
                    type="button"
                    onClick={() => setUserRawScript("")}
                    className="absolute top-2 right-2 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-2 py-0.5 rounded-md transition"
                  >
                    비우기
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 제품 기반 기획 생성 레이아웃 */}
          {activeTab === "create" && (
            <div className="animate-fadeIn">
              <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                자막 스크립트가 없어도 무방합니다! 홍보할 제품명과 주요 특징을
                적어주시면 AI가 1분 숏츠 대본 틀을 제안합니다.
              </p>

              <div className="mb-3.5">
                <label className="text-[10px] font-bold text-neutral-500 block mb-1.5 uppercase tracking-wider">
                  1. 제품 / 서비스명 (필수)
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
                  placeholder="예시: 올인원 수분 로션, AI 자동 번역 이어폰"
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold text-neutral-500 block mb-1.5 uppercase tracking-wider">
                  2. 주요 특징 및 소구 타겟 (선택)
                </label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full h-20 p-2.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition resize-none leading-relaxed"
                  placeholder="예시: 끈적임이 전혀 없고 가성비가 최고임, 20대 대학생 타겟"
                />
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-bold text-neutral-500 block mb-1.5 uppercase tracking-wider">
                  3. 숏츠 대본 스타일
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "funny", label: "🤪 유머러스 / 위트" },
                    { id: "info", label: "🎓 유익한 정보성" },
                    { id: "emotion", label: "🌿 따뜻한 감성스토리" },
                  ].map((option) => (
                    <SelectableChip
                      key={option.id}
                      id={option.id}
                      label={option.label}
                      isSelected={scriptStyle === option.id}
                      onClick={() => setScriptStyle(option.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 공통 실행 버튼 */}
          <button
            onClick={handleGenerateCustomScript}
            disabled={isScriptLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
          >
            {isScriptLoading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>AI 카피라이터가 집필하는 중...</span>
              </>
            ) : (
              <span>
                {activeTab === "transform"
                  ? "AI 맞춤 대본 빌드하기"
                  : "1분 숏츠 기획 대본 뽑아내기"}
              </span>
            )}
          </button>

          <div className="border-b border-neutral-800 mt-7" />

          {/* 공통 컴포넌트로 호출하는 분기 출력창 */}
          {activeTab === "transform" && transformResult && (
            <ScriptResultBox resultText={transformResult} />
          )}
          {activeTab === "create" && createResult && (
            <ScriptResultBox resultText={createResult} />
          )}
        </div>

        <div className="text-[10px] text-neutral-600 text-center pt-4 border-t border-neutral-800/50 mt-6">
          Powered by Google Gemini 2.5 Flash
        </div>
      </div>
    </>
  );
}
