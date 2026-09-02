'use client';

import { useRef, useState } from 'react';
import type { Song } from '@/lib/types';
import { formatViews } from '@/lib/gameLogic';

export default function SongCard({
  song,
  revealed
}: {
  song: Song;
  revealed: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 재생 중인 iframe에 실시간으로 명령을 보내려면 enablejsapi=1 이 필요합니다.
  // postMessage로 mute/unMute를 보내는 방식이라, src 자체를 바꾸지 않아도
  // (=영상이 처음부터 다시 재생되지 않고) 소리만 켜고 끌 수 있습니다.
  function sendCommand(func: 'mute' | 'unMute') {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      'https://www.youtube.com'
    );
  }

  return (
    <div className="bg-panel2 border border-line rounded-xl overflow-hidden flex flex-col">
      <div
        className="relative w-full aspect-video bg-black cursor-pointer"
        onClick={() => setPlaying(true)}
        onMouseEnter={() => playing && sendCommand('unMute')}
        onMouseLeave={() => playing && sendCommand('mute')}
      >
        {playing ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${song.videoId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1`}
            title={song.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`}
              alt={song.title}
              className="w-full h-full object-cover block"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/45 transition">
              <div className="w-[52px] h-[52px] rounded-full bg-[rgba(247,243,234,0.92)] flex items-center justify-center thumb-play-circle" />
            </div>
          </>
        )}
      </div>

      <div className="p-4 pb-4">
        <div className="font-bold text-[15.5px] leading-tight">{song.title}</div>
        <div className="text-muted text-[13px] mt-1">{song.artist}</div>
        <div
          className={`font-display text-[22px] text-gold mt-2.5 flex items-center gap-1.5 ${
            revealed ? 'visible' : 'invisible'
          }`}
        >
          {formatViews(song.views ?? 0)}
          <small className="font-body text-muted text-[11px] font-normal">회</small>
        </div>
      </div>
    </div>
  );
}
