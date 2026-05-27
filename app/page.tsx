"use client";

import { useState } from "react";

// 유튜브 데이터 규격 인터페이스 선언
interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelId: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  duration: string; // ISO 8601 포맷 (예: PT12M45S)
  subscribers: number;
  tags: string[];
}

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

  // 1. 유틸리티: ISO 8601 재생시간 포맷(PT1H2M3S)을 초(Seconds) 단위 숫자로 변환하는 함수
  const parseISO8601ToSeconds = (isoString: string): number => {
    const match = isoString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // 2. 유틸리티: 초(Seconds) 단위를 화면에 띄울 '00:00' 포맷 문자열로 파싱하는 함수
  const formatDuration = (isoString: string): string => {
    const totalSeconds = parseISO8601ToSeconds(isoString);
    if (totalSeconds === 0) return "0:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 3. 유틸리티: 큰 숫자를 천, 만 단위로 이쁘게 축약하는 포맷터
  const formatNumber = (num: number, suffix: string = "") => {
    if (num >= 10000)
      return `${(num / 10000).toFixed(1).replace(".0", "")}만${suffix}`;
    if (num >= 1000)
      return `${(num / 1000).toFixed(1).replace(".0", "")}천${suffix}`;
    return `${num}${suffix}`;
  };

  // 4. 유틸리티: 실시간 날짜 가독성 변환 기법 (예: "3일 전", "2026-05-12")
  const formatDate = (dateStr: string): string => {
    const published = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - published.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "오늘";
    if (diffDays <= 7) return `${diffDays}일 전`;
    return published.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  // ==========================================
  // [새로 추가됨] 테이블 행 클릭 시 서랍 제어 로직
  // ==========================================
  const handleRowClick = async (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsPanelOpen(true);
    setIsPanelLoading(true); // 로딩 스피너 활성화
    setPanelComments([]);
    setIsPlaying(false); // 👈 다른 영상을 클릭하면 플레이어가 닫히고 다시 썸네일이 나오도록 초기화!

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

        {/* 검색 및 2x2 필터 박스 */}
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

            {/* 2x2 격자 구조 필터 피드 */}
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
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setDateRange(item.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        dateRange === item.value
                          ? "bg-neutral-100 text-neutral-950 border-neutral-100 shadow-lg"
                          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
                      }`}
                    >
                      {item.label}
                    </button>
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
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setVideoLength(item.value)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border text-center transition-all 
                        ${
                          videoLength === item.value
                            ? "bg-neutral-100 text-neutral-950 border-neutral-100 shadow-lg"
                            : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
                        }`}
                    >
                      {item.label}
                    </button>
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
                    <button
                      key={count}
                      type="button"
                      onClick={() => setMaxResults(count)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border text-center transition-all 
                        ${
                          maxResults === count
                            ? "bg-neutral-100 text-neutral-950 border-neutral-100 shadow-lg"
                            : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
                        }`}
                    >
                      {count}개
                    </button>
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
              <span>✨</span> 검색 결과{" "}
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
                {/* 뼈대 연동 함수 가동 */}
                {getProcessedResults().map((video) => (
                  <tr
                    key={video.id}
                    onClick={() => handleRowClick(video)} // 행 클릭 이벤트 매핑
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

                      {/* [새로 추가됨] 최대 7개 제한 해시태그 칩 컴포넌트 배정 */}
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 max-w-full">
                          {video.tags.slice(0, 6).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-neutral-950 text-neutral-500 text-[10px] font-medium px-1.5 py-0.5 rounded border border-neutral-800/60 max-w-[100px] truncate"
                              title={tag} // 마우스를 올리면 긴 태그 원본이 툴팁으로 보이게 배려
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    {/* 구독자수 (새로 매핑 처리됨) */}
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

                {/* 대기 상태 스케치 */}
                {isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-16 text-neutral-400 font-medium"
                    >
                      유튜브 실시간 마스터 데이터 취합 중...
                    </td>
                  </tr>
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

      {/* ================================================================= */}
      {/* 댓글 전용 서랍 패널 */}
      {/* ================================================================= */}
      <div
        className={`fixed top-[69px] right-0 bottom-0 w-[420px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedVideo && (
          <>
            {/* 패널 헤더 */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80 backdrop-blur">
              <div className="flex-1 min-w-0 pr-4">
                <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest block mb-1">
                  COMMENT ANALYSIS
                </span>
                <h3
                  className="text-sm font-bold text-neutral-100 truncate"
                  title={selectedVideo.title}
                >
                  {selectedVideo.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsPanelOpen(false);
                  setIsPlaying(false);
                }}
                className="text-neutral-500 hover:text-neutral-200 p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 패널 메인 상단 비디오 요약 */}
            <div className="p-5 bg-neutral-950/40 border-b border-neutral-800/60">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 mb-3 shadow-2xl bg-neutral-950">
                {isPlaying ? (
                  /* 재생 상태일 때: 공식 유튜브 아이프레임 플레이어 노출 */
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  /* 기본 상태일 때: 썸네일 이미지 및 플레이 버튼 마스크 */
                  <div
                    onClick={() => setIsPlaying(true)}
                    className="relative w-full h-full group cursor-pointer overflow-hidden"
                  >
                    <img
                      src={selectedVideo.thumbnail}
                      alt={selectedVideo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* 어두운 오버레이 및 중앙 재생 아이콘 */}
                    <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/50 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 bg-red-600 group-hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all pl-1 duration-300">
                        <span className="text-xl">▶</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-neutral-400 font-semibold mb-1">
                {selectedVideo.channel}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                <span>조회수 {formatNumber(selectedVideo.views, "회")}</span>
                <span>•</span>
                <span>댓글 {formatNumber(selectedVideo.comments, "개")}</span>
              </div>
            </div>

            {/* 댓글 본문 내용 출력 영역 (스크롤 적용) */}
            <div className="flex-1 overflow-y-auto p-5 text-xs leading-relaxed text-neutral-300">
              {isPanelLoading ? (
                <div className="flex h-full flex-col items-center justify-center text-neutral-500 py-20 gap-3">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="animate-pulse text-[11px] font-medium">
                    댓글 수집 중...
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-400 mb-3 flex items-center gap-1.5">
                    <span>🔥</span> TOP 댓글
                  </h4>
                  {panelComments.length > 0 ? (
                    panelComments.map((cmt, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-950/40 border border-neutral-800/40 p-3 rounded-xl hover:border-neutral-700/60 transition-colors"
                      >
                        <div className="flex items-center justify-between font-bold text-[11px] text-neutral-400 mb-1.5">
                          <span>{cmt.author}</span>
                          <span className="text-[10px] text-neutral-600 font-medium">
                            👍 {formatNumber(cmt.likes)}
                          </span>
                        </div>
                        {/* 유튜브 이모지 및 특수 서식을 안전하게 표현하기 위해 innerHTML 바인딩 */}
                        <div
                          className="text-neutral-300 text-[11px] leading-normal break-words"
                          dangerouslySetInnerHTML={{ __html: cmt.text }}
                        ></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-neutral-600 font-medium">
                      댓글이 존재하지 않습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
