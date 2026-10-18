import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SearchBooking from './SearchBooking';
export default function HeroSection() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [paused,setPaused]=useState(false);
  const [failed, setFailed] = useState(false);
  return <section className="hero">
    <div className="hero-media">
      {!failed && <video ref={videoRef} autoPlay muted={muted} loop playsInline preload="metadata" poster="/media/hero/poster.jpg" onError={() => setFailed(true)}><source src="/media/hero/hero-driving.mp4" type="video/mp4"/><source src="/media/hero/hero-driving.webm" type="video/webm"/></video>}
      {failed && <img src="/media/hero/poster.jpg" alt="Автомобиль на дороге"/>}
    </div>
    <div className="container hero-content">
      <div className="eyebrow">Ташкент / Узбекистан</div>
      <h1>Ваш маршрут.<br/><em>Ваши правила.</em></h1>
      <p>Городские улицы, деловые встречи или дорога за горизонт. Выберите автомобиль для своей следующей истории.</p>
      <div className="hero-actions"><Link to="/cars" className="btn btn-primary btn-lg">Подобрать автомобиль ↗</Link><button disabled={failed} className="sound-button" onClick={() => setMuted(!muted)} aria-pressed={!muted}>{muted ? 'Включить звук' : 'Выключить звук'}</button><button className="sound-button" disabled={failed} aria-pressed={paused} onClick={async()=>{if(paused){try{await videoRef.current.play();setPaused(false);}catch{setFailed(true);}}else{videoRef.current.pause();setPaused(true);}}}>{paused?'Продолжить видео':'Пауза'}</button></div>
      <div className="hero-bottom"><span>01 / СВОБОДА ДВИЖЕНИЯ</span><span>Демонстрационный проект · цены учебные</span></div>
      <div id="booking-search"><SearchBooking/></div>
    </div>
  </section>;
}
