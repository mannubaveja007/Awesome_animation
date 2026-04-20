"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

const TOTAL_FRAMES = 450;

export default function FestivalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentIndexRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(4, "0");
      img.src = `/frames/frame_${frameNum}.jpg`;
      img.onload = () => {
        loadedCount++;
        setLoadingProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setLoaded(true);
        }
      };
      
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setLoaded(true);
        }
      };

      images.push(img);
    }
  }, []);

  // Update canvas on scroll
  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const renderFrame = (index: number) => {
      const img = imagesRef.current[index];
      if (!img || !img.complete) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.width;
      const ih = img.height;

      // Calculate object-fit: contain dimensions
      const canvasRatio = cw / ch;
      const imgRatio = iw / ih;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        drawWidth = cw;
        drawHeight = cw / imgRatio;
        offsetX = 0;
        offsetY = (ch - drawHeight) / 2;
      } else {
        drawWidth = ch * imgRatio;
        drawHeight = ch;
        offsetX = (cw - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Handle Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame(currentIndexRef.current);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    let animationFrameId: number;
    let lastRenderedIndex = -1;

    // Subscribe to scroll changes
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Clamp index within bounds
      let frameIndex = Math.floor(latest * TOTAL_FRAMES);
      if (frameIndex >= TOTAL_FRAMES) frameIndex = TOTAL_FRAMES - 1;
      if (frameIndex < 0) frameIndex = 0;

      currentIndexRef.current = frameIndex;

      if (frameIndex !== lastRenderedIndex) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          renderFrame(frameIndex);
          lastRenderedIndex = frameIndex;
        });
      }
    });

    // Initial render
    renderFrame(0);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loaded, scrollYProgress]);

  // Text Animations Opacities
  const op0 = useTransform(scrollYProgress, [0, 0.05, 0.15], [0, 1, 0]); // 0% Intro
  const op25 = useTransform(scrollYProgress, [0.2, 0.25, 0.35], [0, 1, 0]); // 25%
  const op50 = useTransform(scrollYProgress, [0.45, 0.5, 0.6], [0, 1, 0]); // 50%
  const op75 = useTransform(scrollYProgress, [0.7, 0.75, 0.85], [0, 1, 0]); // 75%
  const op95 = useTransform(scrollYProgress, [0.9, 0.95, 1], [0, 1, 1]); // 95% Outro
  const environmentOpacity = useTransform(scrollYProgress, [0.85, 0.95], [1, 0]); // Fade everything to black

  // Text Translations (Y-axis)
  const y1 = useTransform(scrollYProgress, [0, 0.15], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0.2, 0.35], [50, 0]);
  const y3 = useTransform(scrollYProgress, [0.45, 0.6], [50, -50]);
  const y4 = useTransform(scrollYProgress, [0.7, 0.85], [100, 0]);

  return (
    <div ref={containerRef} className="relative h-[600vh] bg-[#050505] cursor-default">
      {/* Preloader Phase */}
      {!loaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]">
          <div className="flex flex-col items-center">
            <h1 className="text-white/80 font-bold tracking-[0.3em] uppercase text-xl mb-8 animate-pulse text-glow">
              Connecting to Simulation
            </h1>
            <div className="w-64 h-1 rounded-full bg-white/10 mb-4 overflow-hidden relative shadow-[0_0_15px_rgba(0,255,255,0.2)]">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-cyan-400/80 font-mono tracking-widest text-xs uppercase">
              Caching [{loadingProgress}%]
            </p>
          </div>
        </div>
      )}

      {/* Sticky Rendering Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Dynamic Background to help blend */}
        <div className="absolute inset-0 bg-[#050505] -z-10" />

        {/* Visual Environment Layer */}
        <motion.div className="absolute inset-0" style={{ opacity: environmentOpacity }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          
          {/* Cinematic Adjustments: Vignette & Bloom simulation */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_120%)] opacity-90 mix-blend-multiply" />
          <div className="absolute inset-0 pointer-events-none bg-fuchsia-500/10 mix-blend-screen opacity-20" />
          
          {/* Subtle Noise for cinematic real-world lens feel */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{ backgroundImage: `url('data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')` }} 
          />
        </motion.div>

        {/* Narrative Layers */}
        {loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            
            {/* Intro */}
            <motion.div 
              className="absolute text-center"
              style={{ opacity: op0, y: y1 }}
            >
              <h1 className="text-white/95 text-5xl md:text-7xl font-extralight tracking-tighter text-glow drop-shadow-2xl">
                Feel The Vibe
              </h1>
            </motion.div>

            {/* Buildup Starts */}
            <motion.div 
              className="absolute left-[10%] md:left-[15%]"
              style={{ opacity: op25, y: y2 }}
            >
              <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-6xl md:text-8xl font-bold tracking-tight text-glow-neon leading-tight">
                Lights Begin<br/>to Pulse
              </h2>
            </motion.div>

            {/* Energy Rising */}
            <motion.div 
              className="absolute text-center"
              style={{ opacity: op50, y: y3 }}
            >
              <h2 className="text-white text-6xl md:text-9xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.7)]">
                Lose Yourself<br/>in the Sound
              </h2>
            </motion.div>

            {/* Peak Chaos */}
            <motion.div 
              className="absolute right-[10%] text-right"
              style={{ opacity: op75, y: y4 }}
            >
              <h2 className="text-white/95 text-5xl md:text-8xl font-bold tracking-widest text-glow drop-shadow-[0_0_40px_rgba(255,0,255,0.5)] leading-[1.1]">
                Pure Chaos.<br/>Pure Energy.
              </h2>
            </motion.div>

            {/* Emotional Outro / CTA */}
            <motion.div 
              className="absolute flex flex-col items-center justify-center"
              style={{ opacity: op95 }}
            >
              <h2 className="text-white/90 text-4xl md:text-6xl font-light tracking-[0.2em] mb-12 text-glow drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">
                Live the Moment.
              </h2>
              <button className="pointer-events-auto px-10 py-5 bg-white text-black font-semibold text-lg uppercase tracking-widest rounded-full hover:bg-transparent hover:text-white border-2 border-transparent hover:border-white transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.8)] transform hover:scale-105 active:scale-95">
                Join The Experience
              </button>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}
