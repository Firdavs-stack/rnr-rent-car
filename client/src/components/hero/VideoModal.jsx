import { useState, useRef, useEffect } from 'react';

export default function VideoModal({ onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handler = () => setProgress((v.currentTime / v.duration) * 100 || 0);
    v.addEventListener('timeupdate', handler);
    return () => v.removeEventListener('timeupdate', handler);
  }, []);

  const togglePlay = () => {
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); }
    else { videoRef.current.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(!muted);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const goFullscreen = () => {
    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 32, zIndex: 10 }}>✕</button>

      <div style={{ width: '90%', maxWidth: 1200, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 4 }} onClick={togglePlay}>
          <source src="/media/hero/hero-driving.mp4" type="video/mp4" />
          <source src="/media/hero/hero-driving.webm" type="video/webm" />
        </video>

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '40px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, cursor: 'pointer' }} onClick={seek}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent)', borderRadius: 2, transition: 'width 0.1s' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18 }}>{playing ? '⏸' : '▶'}</button>
            <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16 }}>{muted ? '🔇' : '🔊'}</button>
            <div style={{ flex: 1 }} />
            <button onClick={goFullscreen} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16 }}>⛶</button>
          </div>
        </div>
      </div>

      {/* Placeholder if no video */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', pointerEvents: 'none', zIndex: -1 }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🎬</p>
        <p>Поместите видеофайл в /public/media/hero/hero-driving.mp4</p>
      </div>
    </div>
  );
}