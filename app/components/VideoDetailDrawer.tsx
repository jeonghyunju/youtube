"use client";

import { YouTubeVideo } from "../types/youtube";
import { formatNumber } from "../utils/format";

interface VideoDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: YouTubeVideo | null;
  isLoading: boolean;
  comments: any[];
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function VideoDetailDrawer({
  isOpen,
  onClose,
  selectedVideo,
  isLoading,
  comments,
  isPlaying,
  setIsPlaying,
}: VideoDetailDrawerProps) {
  return (
    <div
      className={`fixed top-[69px] right-0 bottom-0 w-[420px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
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
                className="text-sm font-bold text-neutral-100 leading-snug break-words"
                title={selectedVideo.title}
              >
                {selectedVideo.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-200 p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 패널 메인 상단 비디오 요약 */}
          <div className="p-5 bg-neutral-950/40 border-b border-neutral-800/60">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 mb-3 shadow-2xl bg-neutral-950">
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : (
                <div
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full group cursor-pointer overflow-hidden"
                >
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/50 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 bg-red-600 group-hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all pl-1 duration-300">
                      <span className="text-xl">▶</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-xs text-neutral-300 font-bold truncate pr-2"
                title={selectedVideo.channel}
              >
                {selectedVideo.channel}
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {/* 채널 보기 버튼 */}
                <a
                  href={`https://www.youtube.com/channel/${selectedVideo.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1.5 rounded-md font-medium border border-neutral-700/50 transition-colors shadow-sm"
                >
                  <span>채널 보기</span>
                </a>

                {/* 유튜브 공식 사이트 이동 버튼 */}
                <a
                  href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-[10px] bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white px-2 py-1.5 rounded-md font-bold transition-all duration-200 shadow-sm"
                  title="유튜브 공식 웹사이트로 이동하여 영상을 시청합니다."
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <span>유튜브에서 보기</span>
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-500">
              <span>조회수 {formatNumber(selectedVideo.views, "회")}</span>
              <span>•</span>
              <span>댓글 {formatNumber(selectedVideo.comments, "개")}</span>
            </div>
          </div>

          {/* 댓글 본문 내용 출력 영역 */}
          <div className="flex-1 overflow-y-auto p-5 text-xs leading-relaxed text-neutral-300">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center text-neutral-500 py-20 gap-3">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="animate-pulse text-[11px] font-medium">
                  댓글 수집 중...
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 mb-3 flex items-center gap-1.5">
                  <span>🔥</span> 댓글 TOP 50
                </h4>
                {comments.length > 0 ? (
                  comments.map((cmt, idx) => (
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
  );
}
