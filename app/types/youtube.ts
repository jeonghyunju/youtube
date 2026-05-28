export interface YouTubeVideo {
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