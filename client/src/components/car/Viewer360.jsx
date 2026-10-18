import { useState, useRef, useCallback, useEffect } from 'react';

export default function Viewer360({ frames, carName }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lastX = useRef(0);
  const containerRef = useRef(null);

  const totalFrames = frames?.length || 0;

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastX.current = e.clientX || e.touches?.[0]?.clientX || 0;
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const delta = x - lastX.current;
    lastX.current = x;
    setCurrentFrame((prev) => {
      const next = prev + (delta > 3 ? 1 : delta < -3 ? -1 : 0);
      return ((next % totalFrames) + totalFrames) % totalFrames;
    });
  }, [isDragging, totalFrames]);

  const handlePointerUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove]);

  useEffect(()=>{const changed=()=>setIsFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',changed);return()=>document.removeEventListener('fullscreenchange',changed);},[]);

  if (!frames || frames.length < 2) {
    return (
      <div style={{ background: 'var(--color-bg-card)', borderRadius: 8, padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        
        <p>360° просмотр пока недоступен для этой модели</p>

      </div>
    );
  }

  const toggleFullscreen = async () => {
    if (!isFullscreen && containerRef.current?.requestFullscreen) {
      try { await containerRef.current.requestFullscreen(); } catch { return; }
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      if(document.fullscreenElement)await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetView = () => { setCurrentFrame(0); setZoom(1); };

  return (
    <div ref={containerRef} style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', userSelect: 'none', touchAction: 'none' }}>
      <div
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, overflow: 'hidden' }}
      >
        <img
          src={frames[currentFrame]?.url}
          alt={`${carName} 360° кадр ${currentFrame + 1}`}
          draggable={false}
          style={{ maxWidth: '100%', maxHeight: '70vh', transform: `scale(${zoom})`, transition: isDragging ? 'none' : 'transform 0.2s' }}
        />
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button aria-label="Предыдущий кадр" onClick={() => setCurrentFrame((p) => (p - 1 + totalFrames) % totalFrames)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18 }}>◀</button>
          <button aria-label="Следующий кадр" onClick={() => setCurrentFrame((p) => (p + 1) % totalFrames)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18 }}>▶</button>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{currentFrame + 1} / {totalFrames}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button aria-label="Увеличить" onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14 }}>+</button>
          <button aria-label="Уменьшить" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14 }}>−</button>
          <button onClick={resetView} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12 }}>Сброс</button>
          <button aria-label="Полный экран" onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14 }}>⛶</button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        360° — перетащите для вращения
      </div>
    </div>
  );
}