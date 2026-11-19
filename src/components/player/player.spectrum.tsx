import { useEffect, useRef } from "react";

const width = 216;
const height = 48;
const barCount = 24;
const lowestFrequency = 45;
const highestFrequency = 12_000;

export function Spectrum({
  analyser,
  active,
  visible,
}: {
  analyser: AnalyserNode | null;
  active: boolean;
  visible: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !analyser) return;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const surface = canvas.current?.getContext("2d");
    if (!surface) return;

    const bins = new Uint8Array(analyser.frequencyBinCount);
    const binWidth = analyser.context.sampleRate / analyser.fftSize;
    const bounds = Array.from({ length: barCount + 1 }, (_, index) =>
      Math.round(
        (lowestFrequency * (highestFrequency / lowestFrequency) ** (index / barCount)) / binWidth,
      ),
    );
    const gradient = surface.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#bff8ff");
    gradient.addColorStop(1, "#348bea");
    surface.fillStyle = gradient;
    let frame = 0;

    function stop() {
      cancelAnimationFrame(frame);
      surface?.clearRect(0, 0, width, height);
    }

    function draw() {
      if (!surface) return;
      analyser?.getByteFrequencyData(bins);
      surface.clearRect(0, 0, width, height);
      for (let bar = 0; bar < barCount; bar++) {
        let peak = 0;
        for (let bin = bounds[bar]; bin < Math.max(bounds[bar] + 1, bounds[bar + 1]); bin++) {
          peak = Math.max(peak, bins[bin] ?? 0);
        }
        const segments = Math.ceil((peak / 255) * 8);
        for (let segment = 0; segment < segments; segment++) {
          surface.fillRect(bar * 9, height - (segment + 1) * 6 + 1, 6, 4);
        }
      }
      frame = requestAnimationFrame(draw);
    }

    function updateMotion() {
      stop();
      if (!reduceMotion.matches) frame = requestAnimationFrame(draw);
    }

    updateMotion();
    reduceMotion.addEventListener("change", updateMotion);
    return () => {
      stop();
      reduceMotion.removeEventListener("change", updateMotion);
    };
  }, [active, analyser]);

  return (
    <div aria-hidden="true" className={`w-full min-w-0 self-center ${visible ? "" : "invisible"}`}>
      <canvas
        className="block h-6 w-full motion-reduce:hidden sm:h-9"
        height={height}
        ref={canvas}
        width={width}
      />
      <span className="hidden h-px w-full border-t border-dashed border-[#8deeff]/60 motion-reduce:block" />
    </div>
  );
}
