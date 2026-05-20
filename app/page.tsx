"use client";

import { useState } from "react";

export default function YouTubeSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("1w"); // 1w, 1m, 3m, 6m, 1y
  const [videoLength, setVideoLength] = useState("all"); // all, short, long
  const [sortBy, setSortBy] = useState("viewCount"); // viewCount, subscriber, relevance
  const [regionCode, setRegionCode] = useState("KR");

  const countries = [
    { name: "대한민국 🇰🇷", code: "KR" }, // 추천 추가
    { name: "미국 🇺🇸", code: "US" },
    { name: "캐나다 🇨🇦", code: "CA" },
    { name: "인도 🇮🇳", code: "IN" },
    { name: "영국 🇬🇧", code: "GB" },
    { name: "프랑스 🇫🇷", code: "FR" },
    { name: "독일 🇩🇪", code: "DE" },
    { name: "스페인 🇪🇸", code: "ES" },
    { name: "일본 🇯🇵", code: "JP" }, // 추천 추가
  ];

  // 임시 검색 결과 데이터 (UI 확인용)
  const dummyResults = [
    {
      id: "1",
      title: "Next.js 15와 Tailwind CSS로 10분 만에 포트폴리오 사이트 만들기",
      channel: "코딩하는 고래",
      views: 12000,
      likes: 480,
      comments: 54,
      date: "3일 전",
      length: "12:45",
      durationSeconds: 765,
      thumbnail:
        "https://i.ytimg.com/vi/ba5ENyqTMls/default.jpg",
    },
    {
      id: "2",
      title: "⚡️ 초고속 유튜브 숏폼 마스터 클래스 (Tip 모음)",
      channel: "쇼츠 제작소",
      views: 450000,
      likes: 24000,
      comments: 1102,
      date: "5일 전",
      length: "0:58",
      durationSeconds: 58,
      thumbnail:
        "https://images.unsplash.com/photo-1626544827763-d516dce335e2?q=80&w=150",
    },
    {
      id: "3",
      title: "TypeScript 기반 대규모 웹 애플리케이션 아키텍처 설계 가이드",
      channel: "TechLead_KR",
      views: 8400,
      likes: 920,
      comments: 184,
      date: "1주일 전",
      length: "45:20",
      durationSeconds: 2720,
      thumbnail:
        "https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=150",
    },
  ];

  const getProcessedResults = () => {
    let filteredItems = [...dummyResults];
    if (videoLength === "short") {
      filteredItems = filteredItems.filter(
        (item) => item.durationSeconds <= 60
      );
    } else if (videoLength === "long") {
      filteredItems = filteredItems.filter((item) => item.durationSeconds > 60);
    }
    return filteredItems;
  };

  const formatNumber = (num: number, suffix: string) => {
    if (num >= 10000)
      return `${(num / 10000).toFixed(1).replace(".0", "")}만${suffix}`;
    if (num >= 1000)
      return `${(num / 1000).toFixed(1).replace(".0", "")}천${suffix}`;
    return `${num}${suffix}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // .trim()을 사용하면 사용자가 공백(스페이스바)만 입력했을 때도 걸러낼 수 있습니다.
    if (!searchQuery.trim()) {
      alert("검색어를 입력해 주세요!");
      return; // 검색어가 없으면 함수를 즉시 종료하여 다음 API 호출 등으로 넘어가지 않게 막습니다.
    }

    // 검색어가 성공적으로 입력되었을 때 실행할 로직
    alert(
      `기본 조회수 정렬 검색!\n국가: ${regionCode}, 기간: ${dateRange}, 길이 필터: ${videoLength}`
    );

    // TODO: 여기에 추후 유튜브 API 연동 함수를 넣을 예정입니다.
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-500 selection:text-white">
      {/* GNB (상단 네비게이션 바) */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* [아이콘: 유튜브 느낌의 재생 버튼 모양 아이콘 로고 자리] */}
          <span className="text-red-500 text-2xl font-bold tracking-tighter flex items-center gap-1">
            <span className="inline-block px-1.5 py-0.5 bg-red-500 text-white rounded-md text-sm">
              ▶
            </span>
            TubeSearch
          </span>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 헤더 텍스트 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            맞춤형 유튜브 영상 검색
          </h1>
          <p className="text-neutral-400 text-base md:text-lg">
            기간별, 영상 길이별 필터를 적용해 원하는 영상을 정확하게 찾아보세요.
          </p>
        </div>

        {/* 검색창 및 필터 섹션 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl mb-12">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* 검색어 입력 인풋 */}
            <div className="relative flex items-center">
              {/* [아이콘: 돋보기 아이콘 들어갈 자리] */}
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
                className="absolute right-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-red-600/10"
              >
                검색
              </button>
            </div>

            {/* 필터 그룹 피드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-800">
              {/* 1. 기간 필터 */}
              <div>
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
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
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

              {/* 2. 국가 선택 드롭다운 필터 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  🌐 검색 대상 국가
                </label>
                <div className="relative flex items-center">
                  <select
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-medium text-xs rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer"
                  >
                    {countries.map((country) => (
                      <option
                        key={country.code}
                        value={country.code}
                        className="bg-neutral-900 text-neutral-200"
                      >
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 text-neutral-500 pointer-events-none transition-colors group-focus-within:text-red-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16" // 테이블/필터 밸런스에 맞춰 24에서 16으로 최적화했습니다.
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5" // 조금 더 선명하게 보이도록 두께를 살짝 조절했습니다.
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-chevron-down"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 3. 영상 길이 필터 (가로 공간 확보로 더 직관적으로 확장) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  🎬 영상 길이
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "전체 형태", value: "all" },
                    { label: "숏폼", value: "short" },
                    { label: "롱폼", value: "long" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setVideoLength(item.value)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
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
              
            </div>
          </form>
        </div>

        {/* 검색 결과 목록 섹션 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>✨</span> 검색 결과 데이터 리스트
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4 w-16 text-center">영상</th>
                  <th className="py-3 px-6">동영상 정보 / 채널</th>
                  <th className="py-3 px-4 w-24 text-right">조회수</th>
                  <th className="py-3 px-4 w-20 text-right">❤️ 좋아요</th>
                  <th className="py-3 px-4 w-20 text-right">💬 댓글</th>
                  <th className="py-3 px-4 w-24 text-center">업로드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs">
                {getProcessedResults().map((video) => (
                  <tr
                    key={video.id}
                    className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                  >
                    {/* 썸네일 컬럼 */}
                    <td className="py-3 px-4 vertical-middle">
                      <div className="relative aspect-video w-32 bg-neutral-950 rounded overflow-hidden border border-neutral-800">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-neutral-950/90 text-[9px] px-1 rounded font-bold text-neutral-300">
                          {video.length}
                        </span>
                      </div>
                    </td>
                    {/* 제목 및 채널 정보 컬럼 */}
                    <td className="py-3 px-6 max-w-xs md:max-w-md">
                      <div className="font-bold text-neutral-100 group-hover:text-red-400 transition-colors line-clamp-1 mb-1 leading-snug">
                        {video.title}
                      </div>
                      <div className="text-neutral-400 font-medium text-[11px]">
                        {video.channel}
                      </div>
                    </td>
                    {/* 데이터 수치 컬럼들 */}
                    <td className="py-3 px-4 text-right font-semibold text-neutral-200">
                      {formatNumber(video.views, "")}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-400 font-medium">
                      {formatNumber(video.likes, "")}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-400 font-medium">
                      {formatNumber(video.comments, "")}
                    </td>
                    {/* 날짜 컬럼 */}
                    <td className="py-3 px-4 text-center text-neutral-500 font-medium whitespace-nowrap">
                      {video.date}
                    </td>
                  </tr>
                ))}

                {getProcessedResults().length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-neutral-500 font-medium"
                    >
                      조건에 맞는 데이터가 존재하지 않습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
