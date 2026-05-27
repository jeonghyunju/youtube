// src/app/api/youtube/details/route.ts
import { NextResponse } from 'next/server';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'YouTube API key is missing' }, { status: 500 });
    }

    // 구글 공식 API로 영상의 관련도 높은 댓글(CommentThreads)
    const commentsUrl = `${YOUTUBE_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=50&key=${API_KEY}`;
    
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    const cleanedComments = commentsData.items?.map((item: any) => {
      const topComment = item.snippet?.topLevelComment?.snippet;
      return {
        author: topComment?.authorDisplayName || 'Anonymous',
        text: topComment?.textDisplay || '', 
        likes: topComment?.likeCount || 0,
      };
    }) || [];

    return NextResponse.json({
      videoId,
      comments: cleanedComments
    });

  } catch (error) {
    console.error('YouTube Details API Global Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
