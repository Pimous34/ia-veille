'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';

interface JtPodcastPlayerProps {
    audioUrl: string;
    isActive: boolean;
    title?: string;
    date?: string;
}

const JtPodcastPlayer: React.FC<JtPodcastPlayerProps> = ({ audioUrl, isActive, title, date }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl]);

    // Handle external pause when format changes
    useEffect(() => {
        if (!isActive && isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive, isPlaying]);

    useEffect(() => {
        // Setup Web Audio API for visualizer
        if (!canvasRef.current || !audioRef.current) return;

        const initAudioContext = () => {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
                analyserRef.current = audioContextRef.current.createAnalyser();
                sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current!);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
                analyserRef.current.fftSize = 256;
            }
        };

        const draw = () => {
            if (!canvasRef.current || !analyserRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;

                // Create gradient for bars
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#A855F7'); // Purple
                gradient.addColorStop(1, '#3B82F6'); // Blue

                ctx.fillStyle = gradient;
                // Draw rounded bars symmetrically or from bottom
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 2;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        if (isPlaying) {
            initAudioContext();
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            draw();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Clear canvas when not playing
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.error("Playback failed:", err));
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const newTime = (parseFloat(e.target.value) / 100) * duration;
        audioRef.current.currentTime = newTime;
        setProgress(parseFloat(e.target.value));
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-gray-900 dark:text-white p-6 relative overflow-hidden transition-colors duration-300">
            {/* Visualizer Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={300}
                    className="w-full h-1/2"
                />
            </div>

            {/* Podcast Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 shadow-2xl relative">
                    <div className={`absolute inset-0 bg-indigo-500/10 rounded-full animate-ping ${isPlaying ? 'block' : 'hidden'}`}></div>
                    <Mic className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h3 className="text-xl font-bold mb-2 truncate w-full text-gray-900 dark:text-white">{title || 'Résumé IA de la semaine'}</h3>
                <p className="text-indigo-600 dark:text-indigo-300 text-sm mb-8">{date || 'Format Podcast'}</p>

                {/* Controls */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    <div className="relative group">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleProgressChange}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-4">
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 bg-indigo-600 dark:bg-white text-white dark:text-indigo-900 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                        >
                            {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                        </button>
                    </div>
                </div>
            </div>

            <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" />
        </div>
    );
};

export default JtPodcastPlayer;
