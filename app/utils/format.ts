// src/app/utils/format.ts

// 1. ISO 8601 재생시간 포맷(PT1H2M3S)을 초(Seconds) 단위 숫자로 변환
export const parseISO8601ToSeconds = (isoString: string): number => {
    const match = isoString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  };
  
  // 2. 초(Seconds) 단위를 화면에 띄울 '00:00' 혹은 '0:00:00' 포맷 문자열로 파싱
  export const formatDuration = (isoString: string): string => {
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
  
  // 3. 큰 숫자를 천, 만 단위로 이쁘게 축약
  export const formatNumber = (num: number, suffix: string = "") => {
    if (num >= 10000) return `${(num / 10000).toFixed(1).replace(".0", "")}만${suffix}`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(".0", "")}천${suffix}`;
    return `${num}${suffix}`;
  };
  
  // 4. 실시간 날짜 가독성 변환 기법 (예: "3일 전", "오늘")
  export const formatDate = (dateStr: string): string => {
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