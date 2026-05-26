// src/app/api/youtube/search/route.ts
import { NextResponse } from 'next/server';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY; // .env.local 파일에 설정 필요

export async function GET(request: Request) {
  try {
    // 0. 프론트엔드로부터 쿼리 파라미터 수신 (검색어, 국가 코드)
    const { searchParams } = new URL(request.url);
    let query = searchParams.get('q');
    const regionCode = searchParams.get('regionCode') || 'KR';

    const maxResultsParam = searchParams.get('maxResults') || '20';
    const maxResults = Math.min(Math.max(parseInt(maxResultsParam, 10) || 20, 1), 50); 

    const dateRange = searchParams.get('dateRange') || '1w';
    const videoLength = searchParams.get('videoLength') || 'all';

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'YouTube API key is missing in server configuration' }, { status: 500 });
    }


    // =================================================================
    // videoDuration 파라미터 1:1 매핑
    // =================================================================
    let durationParam = '';
    if (videoLength === 'short') {
        durationParam = '&videoDuration=short'; // 구글 기준: 4분 이하 영상 전체
    } else if (videoLength === 'long') {
        durationParam = '&videoDuration=long';  // 구글 기준: 20분 이상 장편 영상
    } else {
        durationParam = '&videoDuration=any';
    }

    // ==========================================
    // dateRange에 따른 publishedAfter 계산 (ISO 8601 형식 생성)
    // ==========================================
    const now = new Date();
    if (dateRange === '1w') {
      now.setDate(now.getDate() - 7);
    } else if (dateRange === '1m') {
      now.setMonth(now.getMonth() - 1);
    } else if (dateRange === '3m') {
      now.setMonth(now.getMonth() - 3);
    } else if (dateRange === '6m') {
      now.setMonth(now.getMonth() - 6);
    } else if (dateRange === '1y') {
      now.setFullYear(now.getFullYear() - 1);
    }
    const publishedAfter = now.toISOString(); // 예: 2026-05-15T17:34:05.000Z

    // ==========================================
    // STEP 1: 유튜브 검색 API 호출 (search.list)
    // ==========================================
    // 대량 호출 방지를 위해 결과는 20개로 제한, 조회수순(viewCount) 기본 정렬
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&regionCode=${regionCode}&publishedAfter=${encodeURIComponent(publishedAfter)}${durationParam}&order=viewCount&type=video&maxResults=${maxResults}&key=${API_KEY}`;
    
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
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        channel: item.snippet.channelTitle,
        channelId: channelId,
        date: item.snippet.publishedAt, // ISO 8601 포맷
      };
    });

    // 쉼표로 연결된 문자열 생성 (예: "id1,id2,id3") -> 할당량 절약을 위한 배치 처리 필수 스펙
    const videoIdsStr = videoIds.join(',');
    const channelIdsStr = Array.from(new Set(channelIds)).join(','); // 중복 채널 ID 제거 후 결합

    // ==========================================
    // STEP 2 & 3: 상세 스펙 일괄 요청 (Promise.all 병렬 처리)
    // ==========================================
    const videosUrl = `${YOUTUBE_API_BASE}/videos?part=statistics,contentDetails&id=${videoIdsStr}&key=${API_KEY}`;
    const channelsUrl = `${YOUTUBE_API_BASE}/channels?part=statistics&id=${channelIdsStr}&key=${API_KEY}`;

    const [videosRes, channelsRes] = await Promise.all([
      fetch(videosUrl),
      fetch(channelsUrl)
    ]);

    const videosData = await videosRes.json();
    const channelsData = await channelsRes.json();

    // 빠른 검색 매칭을 위해 매핑 맵(Map) 자료구조로 가공
    const videoStatsMap = new Map();
    videosData.items?.forEach((v: any) => {
      videoStatsMap.set(v.id, {
        views: parseInt(v.statistics?.viewCount || '0', 10),
        likes: parseInt(v.statistics?.likeCount || '0', 10),
        comments: parseInt(v.statistics?.commentCount || '0', 10),
        duration: v.contentDetails?.duration, // ISO 8601 포맷 재생시간 (예: PT12M45S)
      });
    });

    const channelStatsMap = new Map();
    channelsData.items?.forEach((c: any) => {
      channelStatsMap.set(c.id, {
        subscribers: parseInt(c.statistics?.subscriberCount || '0', 10),
      });
    });

    // ==========================================
    // STEP 4: 데이터 결합 (마스터 조인)
    // ==========================================
    const finalizedResult = baseItems.map((item: any) => {
      const vStats = videoStatsMap.get(item.id) || { views: 0, likes: 0, comments: 0, duration: 'PT0S' };
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
      };
    });

    return NextResponse.json({ items: finalizedResult });
  } catch (error) {
    console.error('YouTube Proxy API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}