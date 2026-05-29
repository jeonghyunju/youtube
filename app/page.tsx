"use client";

import { useState } from "react";
import VideoDetailDrawer from "./components/VideoDetailDrawer";
import SelectableChip from "./components/SelectableChip";
import { YouTubeVideo } from "./types/youtube";
import {
  parseISO8601ToSeconds,
  formatDuration,
  formatNumber,
  formatDate,
} from "./utils/format";

export default function YouTubeSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("1w");
  const [videoLength, setVideoLength] = useState("any");
  const [regionCode, setRegionCode] = useState("KR");
  const [maxResults, setMaxResults] = useState("20");

  // 실시간 API 데이터 및 로딩/에러 상태 관리
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 상세 보기 우측 서랍 패널 관련 상태 변수
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelLoading, setIsPanelLoading] = useState(false);
  const [panelComments, setPanelComments] = useState<any[]>([]);

  // 동영상 재생 여부 상태 변수
  const [isPlaying, setIsPlaying] = useState(false);

  const countries = [
    { name: "대한민국 🇰🇷", code: "KR" },
    { name: "미국 🇺🇸", code: "US" },
    { name: "캐나다 🇨🇦", code: "CA" },
    { name: "인도 🇮🇳", code: "IN" },
    { name: "영국 🇬🇧", code: "GB" },
    { name: "프랑스 🇫🇷", code: "FR" },
    { name: "독일 🇩🇪", code: "DE" },
    { name: "스페인 🇪🇸", code: "ES" },
    { name: "일본 🇯🇵", code: "JP" },
  ];

  // 5. 비즈니스 로직: Next.js 백엔드 Route Handler 호출 함수
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert("검색어를 입력해 주세요!");
      return;
    }

    setIsLoading(true);
    setIsPanelOpen(false);
    setIsPlaying(false);

    try {
      // 설계한 백엔드 API 엔드포인트에 쿼리 파라미터 전달
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(
          searchQuery
        )}&regionCode=${regionCode}&maxResults=${maxResults}&dateRange=${dateRange}&videoLength=${videoLength}`
      );
      const data = await response.json();

      if (response.ok) {
        setVideos(data.items || []);

        if (data.meta && data.meta.isTranslated && data.meta.searchedQuery) {
          setSearchQuery(data.meta.searchedQuery);
        }
      } else {
        alert(data.error || "데이터를 가져오는 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("서버와의 통신이 원활하지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. 비즈니스 로직: 받아온 원본 배열에 사용자가 선택한 '영상 길이' 필터를 연동하는 함수
  const getProcessedResults = () => {
    return videos;
  };

  // 테이블 행 클릭 시 서랍 제어 로직
  const handleRowClick = async (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsPanelOpen(true);
    setIsPanelLoading(true); 
    setPanelComments([]);
    setIsPlaying(false); 

    try {
      const response = await fetch(`/api/youtube/details?videoId=${video.id}`);
      const data = await response.json();

      if (response.ok) {
        setPanelComments(data.comments || []);
      }
    } catch (error) {
      console.error("상세 댓글 바인딩 실패:", error);
    } finally {
      setIsPanelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500 selection:text-white">
      {/* 상단 네비게이션 바 */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-2xl font-bold tracking-tighter flex items-center gap-1.5">
            <span className="inline-block px-3 py-0.5 bg-red-500 text-white rounded-md text-sm">
              ▶
            </span>
            TubeSearch
          </span>
        </div>
      </header>

      {/* 메인 본문 */}
      <main
        className={`mx-auto px-6 py-12 transition-all duration-300 ${
          isPanelOpen ? "max-w-[calc(100vw-460px)] ml-6" : "max-w-5xl"
        }`}
      >
        {/* 타이틀 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            맞춤형 유튜브 영상 검색
          </h1>
          <p className="text-neutral-400 text-base md:text-lg">
            국가별 트렌드를 반영하여 원하는 영상 데이터를 표 형태로 정갈하게
            한눈에 비교해보세요.
          </p>
        </div>

        {/* 검색 박스 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl mb-12">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* 검색창 인풋 */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-neutral-500 pointer-events-none text-lg">
                🔍
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-28 py-4 text-base focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-neutral-600"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                {isLoading ? "로딩 중.." : "검색"}
              </button>
            </div>

            {/* 검색 조건 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-5 border-t border-neutral-800">
              {/* 1. 기간 필터 (1행 1열) */}
              <div className="bg-neutral-950/30 p-4 rounded-xl border border-neutral-800/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  📅 조회 기간
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "일주일", value: "1w" },
                    { label: "1개월", value: "1m" },
                    { label: "3개월", value: "3m" },
                    { label: "6개월", value: "6m" },
                    { label: "1년", value: "1y" },
                  ].map((item) => (
                    <SelectableChip
                      key={item.value}
                      id={item.value}
                      label={item.label}
                      isSelected={dateRange === item.value}
                      onClick={() => setDateRange(item.value)}
                      variant="mono"
                      size="sm" 
                    />
                  ))}
                </div>
              </div>

              {/* 2. 국가 선택 드롭다운 필터 (1행 2열) */}
              <div className="bg-neutral-950/30 p-4 rounded-xl border border-neutral-800/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  🌐 검색 대상 국가
                </label>
                <div className="relative flex items-center">
                  <select
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-medium text-xs rounded-lg pl-3 pr-10 py-2.5 appearance-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer"
                  >
                    {countries.map((country) => (
                      <option
                        key={country.code}
                        value={country.code}
                        className="bg-neutral-900 text-neutral-200"
                      >
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 text-neutral-500 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-chevron-down"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 3. 영상 길이 필터 (2행 1열) */}
              <div className="bg-neutral-950/30 p-4 rounded-xl border border-neutral-800/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  🎬 영상 길이
                </label>
                <div className="flex gap-1.5">
                  {[
                    { label: "전체", value: "any" },
                    { label: "숏폼", value: "short" },
                    { label: "롱폼", value: "long" },
                  ].map((item) => (
                    <SelectableChip
                      key={item.value}
                      id={item.value}
                      label={item.label}
                      isSelected={videoLength === item.value}
                      onClick={() => setVideoLength(item.value)}
                      variant="mono" 
                      size="sm" 
                    />
                  ))}
                </div>
              </div>

              {/* 4. 검색 결과 개수 필터 (2행 2열) */}
              <div className="bg-neutral-950/30 p-4 rounded-xl border border-neutral-800/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  🔢 조회 개수 (최대)
                </label>
                <div className="flex gap-1.5">
                  {["20", "30", "50"].map((count) => (
                    <SelectableChip
                      key={count}
                      id={count}
                      label={`${count}개`}
                      isSelected={maxResults === count}
                      onClick={() => setMaxResults(count)}
                      variant="mono"
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* 결과 테이블 데이터 대시보드 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              검색 결과{" "}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4 w-16 text-center">영상</th>
                  <th className="py-3 px-4">동영상 정보 / 채널</th>
                  <th className="py-3 px-2 w-22 text-right">구독자수</th>
                  <th className="py-3 px-2 w-24 text-right">조회수</th>
                  <th className="py-3 px-2 w-20 text-right">좋아요</th>
                  <th className="py-3 px-2 w-20 text-right">댓글</th>
                  <th className="py-3 px-2 w-24 text-center">업로드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-28 text-center">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 rounded-full border-4 border-neutral-800"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                        </div>

                        <div className="space-y-1.5 animate-pulse">
                          <p className="text-sm font-bold text-neutral-200">
                            유튜브 실시간 마스터 데이터 취합 중...
                          </p>
                          <p className="text-xs text-neutral-500">
                            AI 번역 연산 및 국가별 실시간 통계를 병렬 취합하고
                            있습니다. 잠시만 기다려 주세요.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {getProcessedResults().map((video) => (
                      <tr
                        key={video.id}
                        onClick={() => handleRowClick(video)} 
                        className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      >
                        {/* 썸네일 */}
                        <td className="py-3 px-4 align-middle">
                          <div className="relative aspect-video w-32 bg-neutral-950 rounded overflow-hidden border border-neutral-800">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-neutral-950/90 text-[9px] px-1 rounded font-bold text-neutral-300">
                              {formatDuration(video.duration)}
                            </span>
                          </div>
                        </td>
                        {/* 제목 및 채널 */}
                        <td className="py-3 px-4 max-w-xs md:max-w-sm align-middle">
                          <div className="font-bold text-neutral-100 group-hover:text-red-400 transition-colors line-clamp-1 mb-1 leading-snug">
                            {video.title}
                          </div>
                          <div className="text-neutral-400 font-medium text-[11px] flex items-center gap-1 mb-2">
                            <span>{video.channel}</span>
                          </div>

                          {/* 해시태그 칩 컴포넌트 */}
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 max-w-full">
                              {video.tags.slice(0, 6).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-neutral-950 text-neutral-500 text-[10px] font-medium px-1.5 py-0.5 rounded border border-neutral-800/60 max-w-[100px] truncate"
                                  title={tag} 
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* 구독자수 */}
                        <td className="py-3 px-2 text-right font-medium text-neutral-300 align-middle">
                          {formatNumber(video.subscribers, "명")}
                        </td>
                        {/* 조회수 */}
                        <td className="py-3 px-2 text-right font-semibold text-neutral-200 align-middle">
                          {formatNumber(video.views, "회")}
                        </td>
                        {/* 좋아요 */}
                        <td className="py-3 px-2 text-right text-neutral-400 font-medium align-middle">
                          {formatNumber(video.likes, "")}
                        </td>
                        {/* 댓글 */}
                        <td className="py-3 px-2 text-right text-neutral-400 font-medium align-middle">
                          {formatNumber(video.comments, "")}
                        </td>
                        {/* 날짜 */}
                        <td className="py-3 px-2 text-center text-neutral-500 font-medium whitespace-nowrap align-middle">
                          {formatDate(video.date)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* 결과 빈 화면 제어 */}
                {!isLoading && getProcessedResults().length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-16 text-neutral-500 font-medium"
                    >
                      {videos.length === 0
                        ? "검색어를 입력해 데이터를 조회해보세요."
                        : "필터 조건에 부합하는 영상이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <VideoDetailDrawer
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setIsPlaying(false);
        }}
        selectedVideo={selectedVideo}
        isLoading={isPanelLoading}
        comments={panelComments}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    </div>
  );
}
