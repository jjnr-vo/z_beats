import { useRef, useState } from "react";

import { PlayerView } from "./player.view";
import type { PlayerTrack } from "@/shared/player-track";

const initialMedia = { generation: 0, currentTime: 0, duration: 0, playing: false };

export function Player({
  error,
  playerTrack,
  setError,
}: {
  error: string | null;
  playerTrack: PlayerTrack | null;
  setError: (message: string | null) => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const autoplayAttempted = useRef<HTMLAudioElement | null>(null);
  const [media, setMedia] = useState(initialMedia);
  const [volume, setVolume] = useState(1);
  const playback = media.generation === playerTrack?.generation ? media : initialMedia;

  function sync(element: HTMLAudioElement) {
    if (!playerTrack || audio.current !== element) return;
    setMedia({
      generation: playerTrack.generation,
      currentTime: element.currentTime,
      duration: Number.isFinite(element.duration) ? element.duration : 0,
      playing: !element.paused && !element.ended,
    });
  }

  async function togglePlayback() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    setError(null);
    try {
      await element.play();
    } catch {
      if (audio.current === element)
        setError("Playback could not start. Try selecting the track again.");
    }
  }

  function seek(time: number) {
    const element = audio.current;
    if (!element || !playback.duration) return;
    element.currentTime = time;
    sync(element);
  }

  function changeVolume(level: number) {
    if (audio.current) audio.current.volume = level;
    setVolume(level);
  }

  async function loadTrack(element: HTMLAudioElement) {
    if (autoplayAttempted.current === element) return;
    autoplayAttempted.current = element;
    element.volume = volume;
    sync(element);
    try {
      await element.play();
    } catch {
      if (audio.current === element) {
        setError("Playback could not start automatically. Press Play in the player.");
      }
    }
  }

  return (
    <>
      {playerTrack && (
        <audio
          ref={audio}
          key={playerTrack.generation}
          aria-label={`${playerTrack.track.title} by ${playerTrack.track.artist}`}
          onDurationChange={(event) => sync(event.currentTarget)}
          onEnded={(event) => sync(event.currentTarget)}
          onError={() =>
            setError(
              "Audio could not be loaded. Access may have expired; try selecting the track again.",
            )
          }
          onLoadedMetadata={(event) => void loadTrack(event.currentTarget)}
          onPause={(event) => sync(event.currentTarget)}
          onPlay={(event) => {
            setError(null);
            sync(event.currentTarget);
          }}
          onTimeUpdate={(event) => sync(event.currentTarget)}
          preload="metadata"
          src={playerTrack.access.url}
        />
      )}
      <PlayerView
        currentTime={playback.currentTime}
        duration={playback.duration}
        error={error}
        onSeek={seek}
        onTogglePlayback={() => void togglePlayback()}
        onVolumeChange={changeVolume}
        playing={playback.playing}
        track={playerTrack?.track}
        volume={volume}
      />
    </>
  );
}
