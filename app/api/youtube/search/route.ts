// src/app/api/youtube/search/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;
const AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

const ai = new GoogleGenerativeAI(AI_API_KEY || "");

export async function GET(request: Request) {
  try {
    // 0. 프론트엔드로부터 쿼리 파라미터 수신 (검색어, 국가 코드)
    const { searchParams } = new URL(request.url);
    let query = searchParams.get("q") || "";
    const regionCode = searchParams.get("regionCode") || "KR";

    const maxResultsParam = searchParams.get("maxResults") || "20";
    const maxResults = Math.min(
      Math.max(parseInt(maxResultsParam, 10) || 20, 1),
      50
    );

    const dateRange = searchParams.get("dateRange") || "1w";
    const videoLength = searchParams.get("videoLength") || "all";

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: "YouTube API key is missing in server configuration" },
        { status: 500 }
      );
    }

    let originalQuery = query;
    let isTranslated = false;

    // =================================================================
    // [새로 추가됨] ISO 639-1 표준 언어 코드(소문자 2자리) 자동 매핑 구조
    // =================================================================
    const languageMapISO639: { [key: string]: string } = {
      KR: "ko", // 한국어
      US: "en", // 영어
      CA: "en", // 영어 (캐나다)
      GB: "en", // 영어 (영국)
      IN: "hi", // 힌디어 (인도)
      FR: "fr", // 프랑스어
      DE: "de", // 독일어
      ES: "es", // 스페인어
      JP: "ja", // 일본어
    };

    // 선택된 국가 코드에 맞는 언어 코드를 추출 (없으면 기본값 영어 'en')
    const relevanceLanguage = languageMapISO639[regionCode] || "en";

    // =================================================================
    // 국가가 한국(KR)이 아닐 때, Gemini AI를 통한 유튜브 맞춤 의역 엔진 가동
    // =================================================================
    if (regionCode !== "KR") {
      try {
        const languageMap: { [key: string]: string } = {
          US: "Natural English (United States)",
          CA: "Natural English (Canada)",
          GB: "Natural English (United Kingdom)",
          IN: "Hindi or natural English popular in India", // 인도는 힌디어나 인도식 영어 트렌드 반영
          FR: "Natural French (Français)",
          DE: "Natural German (Deutsch)",
          ES: "Natural Spanish (Español)",
          JP: "Natural Japanese (日本語)",
        };

        const targetLanguage = languageMap[regionCode] || "Natural English";

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

        // AI가 정형화된 단어 하나만 딱 뱉도록 가이드하는 프롬프트 조립
        const prompt = `
            You are a professional localizer and cultural expert specializing in global social media and YouTube trends.
            Translate and localize the following Korean search query into ${targetLanguage} that real native speakers in that specific country (${regionCode}) would actually use when searching for videos on YouTube.
      
            CRITICAL REQUIREMENT: Focus on real YouTube tags, cultural expressions, local memes, slang, or trending keywords of that specific region. 
            For example, if the query is "생활 꿀팁" and the target is English, use "life hacks". If the target is Japanese, use "인터넷에 유행하는 일본 현지 꿀팁 표현(예: ライフハック 또는 豆知識 등 상황에 맞는 최적의 단어)".
      
             Provide ONLY the final localized search query text. Do not include any explanations, quotes, introduction, or punctuation.
      
            Korean Query: ${originalQuery}
        `;

        const aiResult = await model.generateContent(prompt);
        const translatedText = aiResult.response.text().trim();

        const cleanedText = translatedText.replace(/^["']|["']$/g, "");

        if (cleanedText && cleanedText !== originalQuery) {
          query = cleanedText;
          isTranslated = true;
          console.log(
            `[AI 국가별 현지화 완료] 국가: ${regionCode} | ${originalQuery} -> ${query}`
          );
        }
      } catch (aiError) {
        console.error(
          "AI Translation error, proceeding with original query:",
          aiError
        );
      }
    }

    // =================================================================
    // videoDuration 파라미터 1:1 매핑
    // =================================================================
    let durationParam = "";
    if (videoLength === "short") {
      durationParam = "&videoDuration=short"; // 구글 기준: 4분 이하 영상 전체
    } else if (videoLength === "long") {
      durationParam = "&videoDuration=long"; // 구글 기준: 20분 이상 장편 영상
    } else {
      durationParam = "&videoDuration=any";
    }

    // ==========================================
    // dateRange에 따른 publishedAfter 계산 (ISO 8601 형식 생성)
    // ==========================================
    const now = new Date();
    if (dateRange === "1w") {
      now.setDate(now.getDate() - 7);
    } else if (dateRange === "1m") {
      now.setMonth(now.getMonth() - 1);
    } else if (dateRange === "3m") {
      now.setMonth(now.getMonth() - 3);
    } else if (dateRange === "6m") {
      now.setMonth(now.getMonth() - 6);
    } else if (dateRange === "1y") {
      now.setFullYear(now.getFullYear() - 1);
    }
    const publishedAfter = now.toISOString(); // 예: 2026-05-15T17:34:05.000Z

    // ==========================================
    // STEP 1: 유튜브 검색 API 호출 (search.list)
    // ==========================================
    // 대량 호출 방지를 위해 결과는 20개로 제한, 조회수순(viewCount) 기본 정렬
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(
      query
    )}&regionCode=${regionCode}&relevanceLanguage=${relevanceLanguage}&publishedAfter=${encodeURIComponent(
      publishedAfter
    )}${durationParam}&order=viewCount&type=video&maxResults=${maxResults}&key=${API_KEY}`;

    // console.log('search url : ', searchUrl);

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // 상세 조회를 위해 검색 결과에서 비디오 ID 배열과 채널 ID 배열을 가공
    const videoIds: string[] = [];
    const channelIds: string[] = [];

    // 검색 기본 정보 매핑 뼈대 구축
    const baseItems = searchData.items.map((item: any) => {
      const videoId = item.id.videoId;
      const channelId = item.snippet.channelId;

      if (videoId) videoIds.push(videoId);
      if (channelId) channelIds.push(channelId);

      return {
        id: videoId,
        title: item.snippet.title,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url,
        channel: item.snippet.channelTitle,
        channelId: channelId,
        date: item.snippet.publishedAt, // ISO 8601 포맷
      };
    });

    // 쉼표로 연결된 문자열 생성 (예: "id1,id2,id3") -> 할당량 절약을 위한 배치 처리 필수 스펙
    const videoIdsStr = videoIds.join(",");
    const channelIdsStr = Array.from(new Set(channelIds)).join(","); // 중복 채널 ID 제거 후 결합

    // ==========================================
    // STEP 2 & 3: 상세 스펙 일괄 요청 
    // ==========================================
    const videosUrl = `${YOUTUBE_API_BASE}/videos?part=statistics,contentDetails,snippet&id=${videoIdsStr}&key=${API_KEY}`;
    const channelsUrl = `${YOUTUBE_API_BASE}/channels?part=statistics&id=${channelIdsStr}&key=${API_KEY}`;

    const [videosRes, channelsRes] = await Promise.all([
      fetch(videosUrl),
      fetch(channelsUrl),
    ]);

    const videosData = await videosRes.json();
    const channelsData = await channelsRes.json();

    // 빠른 검색 매칭을 위해 매핑 맵(Map) 자료구조로 가공
    const videoStatsMap = new Map();
    videosData.items?.forEach((v: any) => {
      videoStatsMap.set(v.id, {
        views: parseInt(v.statistics?.viewCount || "0", 10),
        likes: parseInt(v.statistics?.likeCount || "0", 10),
        comments: parseInt(v.statistics?.commentCount || "0", 10),
        duration: v.contentDetails?.duration, // ISO 8601 포맷 재생시간 (예: PT12M45S)
        tags: v.snippet?.tags || [],
      });
    });

    const channelStatsMap = new Map();
    channelsData.items?.forEach((c: any) => {
      channelStatsMap.set(c.id, {
        subscribers: parseInt(c.statistics?.subscriberCount || "0", 10),
      });
    });

    // ==========================================
    // STEP 4: 데이터 결합 (마스터 조인)
    // ==========================================
    const finalizedResult = baseItems.map((item: any) => {
      const vStats = videoStatsMap.get(item.id) || {
        views: 0,
        likes: 0,
        comments: 0,
        duration: "PT0S",
        tags: [],
      };
      const cStats = channelStatsMap.get(item.channelId) || { subscribers: 0 };

      return {
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        channel: item.channel,
        channelId: item.channelId,
        date: item.date,
        // 비디오 상세 정보 주입
        views: vStats.views,
        likes: vStats.likes,
        comments: vStats.comments,
        duration: vStats.duration,
        // 채널 상세 정보 주입
        subscribers: cStats.subscribers,
        tags: vStats.tags,
      };
    });

    return NextResponse.json({
      items: finalizedResult,
      meta: {
        searchedQuery: query,
        originalQuery: originalQuery,
        isTranslated: isTranslated,
      },
    });
  } catch (error) {
    console.error("YouTube Proxy API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
