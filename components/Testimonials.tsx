import React, { useState, useRef, useEffect } from 'react';
import Section from './Section';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Testimonials: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 1;
      setVolume(volume > 0 ? volume : 1);
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Section id="depoimentos" darker>
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-cream mb-4">
          Quem vende recomenda
        </h2>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
        {/* Imagens dos prints do WhatsApp (Caminho: /public/provas-sociais/) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {[
            { src: '/provas-sociais/whats-01.png', alt: 'Print do WhatsApp 1 completo' },
            { src: '/provas-sociais/whats-02.jpg', alt: 'Print do WhatsApp 2 completo' },
            { src: '/provas-sociais/whats-03.jpg', alt: 'Print do WhatsApp 3 completo' },
          ].map((img, idx) => (
            <div 
              key={idx}
              className={`ProofImgCard relative cursor-pointer group ${idx === 2 ? 'sm:col-span-2 md:col-span-1 sm:w-1/2 md:w-full sm:mx-auto' : ''}`}
              onClick={() => setSelectedImage(img.src)}
            >
              <div className="ProofImgFrame">
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  loading="lazy"
                  className="ProofImg transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center rounded-[16px]">
                <span className="bg-black/70 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium backdrop-blur-sm">
                  Ampliar
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Player de áudio customizado */}
        <div className="w-full max-w-md">
          <style>{`
            .ProofImgCard {
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              overflow: hidden;
              background: linear-gradient(180deg, rgba(41, 37, 36, 0.8), rgba(28, 25, 23, 0.9));
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
              aspect-ratio: 9/16;
            }
            .ProofImgFrame {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 12px;
            }
            .ProofImg {
              width: 100%;
              height: 100%;
              object-fit: contain;
              object-position: center;
            }
            .SocialProofAudioCard {
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              padding: 16px;
              background: rgba(41, 37, 36, 0.8);
              backdrop-filter: saturate(1.2) blur(8px);
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .SocialProofAudioCard:hover {
              transform: translateY(-2px);
              box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.4);
            }
            .SocialProofAudioHeader {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 12px;
            }
            .SocialProofAudioBadge {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 4px 10px;
              border-radius: 999px;
              background: rgba(251, 191, 36, 0.15);
              color: #fbbf24;
            }
            .SocialProofAudioTitle {
              font-weight: 600;
              font-size: 14px;
              color: #f5f5f4;
            }
            .SocialProofAudioControls {
              display: flex;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
            }
            .AudioBtnPlay {
              width: 44px;
              height: 44px;
              border-radius: 999px;
              border: none;
              background: #fbbf24;
              color: #1c1917;
              display: grid;
              place-items: center;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .AudioBtnPlay:hover {
              background: #f59e0b;
              transform: scale(1.05);
            }
            .AudioBtnPlay:focus-visible {
              outline: 2px solid #fbbf24;
              outline-offset: 2px;
            }
            .AudioProgressWrap {
              flex: 1;
              min-width: 150px;
              cursor: pointer;
              padding: 8px 0;
            }
            .AudioProgressTrack {
              height: 6px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.15);
              position: relative;
              overflow: hidden;
            }
            .AudioProgressFill {
              height: 100%;
              width: 0%;
              border-radius: 999px;
              background: #fbbf24;
              transition: width 0.1s linear;
            }
            .AudioTime {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              color: rgba(245, 245, 244, 0.7);
              white-space: nowrap;
            }
            .AudioVolume {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .AudioVolBtn {
              background: transparent;
              border: none;
              color: rgba(245, 245, 244, 0.7);
              cursor: pointer;
              display: grid;
              place-items: center;
              padding: 4px;
              border-radius: 4px;
            }
            .AudioVolBtn:hover {
              color: #f5f5f4;
              background: rgba(255, 255, 255, 0.05);
            }
            .AudioVolRange {
              width: 60px;
              height: 4px;
              -webkit-appearance: none;
              background: rgba(255, 255, 255, 0.15);
              border-radius: 999px;
              outline: none;
            }
            .AudioVolRange::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #f5f5f4;
              cursor: pointer;
            }
            .AudioVolRange::-moz-range-thumb {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #f5f5f4;
              cursor: pointer;
              border: none;
            }
            .AudioHiddenEngine {
              display: none;
            }
            @media (max-width: 480px) {
              .AudioVolume {
                display: none;
              }
            }
          `}</style>
          
          <div className="SocialProofAudioCard">
            <div className="SocialProofAudioHeader">
              <span className="SocialProofAudioBadge">Áudio real</span>
              <span className="SocialProofAudioTitle">Depoimento de parceiro</span>
            </div>
            
            <div className="SocialProofAudioControls">
              <button 
                type="button" 
                className="AudioBtnPlay" 
                aria-label={isPlaying ? "Pausar" : "Tocar"}
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              
              <div 
                className="AudioProgressWrap" 
                role="slider" 
                aria-label="Progresso do áudio"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercentage}
                onClick={handleProgressClick}
                ref={progressRef}
              >
                <div className="AudioProgressTrack">
                  <div 
                    className="AudioProgressFill" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="AudioTime">
                <span className="AudioTimeCurrent">{formatTime(currentTime)}</span>
                <span className="AudioTimeSep">/</span>
                <span className="AudioTimeDuration">{formatTime(duration)}</span>
              </div>
              
              <div className="AudioVolume">
                <button 
                  type="button" 
                  className="AudioVolBtn" 
                  onClick={toggleMute}
                  aria-label={isMuted ? "Ativar som" : "Mudo"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input 
                  className="AudioVolRange" 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume" 
                />
              </div>
            </div>
            
            <audio 
              ref={audioRef}
              className="AudioHiddenEngine" 
              preload="metadata" 
              src="/audio/prova-social.mp3"
            ></audio>
            
            <noscript>
              <audio controls src="/audio/prova-social.mp3" className="w-full mt-4"></audio>
            </noscript>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <img 
            src={selectedImage} 
            alt="Print ampliado" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Section>
  );
};

export default Testimonials;