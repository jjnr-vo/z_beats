import { useEffect, useRef, useState } from "react";

type Graph = {
  context: AudioContext;
  analyser: AnalyserNode;
  element?: HTMLAudioElement;
  source?: MediaElementAudioSourceNode;
};

export function useSpectrum() {
  const graph = useRef<Graph | null>(null);
  const requested = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      requested.current = false;
      const current = graph.current;
      graph.current = null;
      if (current) void current.context.close();
    };
  }, []);

  function unavailable() {
    requested.current = false;
    setEnabled(false);
    setAnalyser(null);
    setMessage("The visualizer is unavailable in this browser.");
  }

  function disconnectPreviousTrack(element: HTMLAudioElement) {
    const current = graph.current;
    if (current?.source && current.element !== element) {
      current.source.disconnect();
      current.source = undefined;
      current.element = undefined;
      setAnalyser(null);
    }
  }

  function connectTrack(element: HTMLAudioElement) {
    disconnectPreviousTrack(element);
    const current = graph.current;
    if (!requested.current || current?.context.state !== "running") return;
    try {
      if (!current.source) {
        const source = current.context.createMediaElementSource(element);
        source.connect(current.context.destination);
        source.connect(current.analyser);
        current.source = source;
        current.element = element;
      }
      setAnalyser(current.analyser);
    } catch {
      unavailable();
    }
  }

  async function toggle(getElement: () => HTMLAudioElement | null) {
    if (requested.current) {
      requested.current = false;
      setEnabled(false);
      setAnalyser(null);
      return;
    }
    if (!getElement()) return;

    requested.current = true;
    setEnabled(true);
    setMessage(null);
    try {
      if (!graph.current) {
        const context = new AudioContext();
        const node = context.createAnalyser();
        node.fftSize = 4096;
        node.smoothingTimeConstant = 0.65;
        graph.current = { context, analyser: node };
      }

      const current = graph.current;
      if (current.context.state !== "running") await current.context.resume();
      const element = getElement();
      if (graph.current === current && element) connectTrack(element);
    } catch {
      if (requested.current) unavailable();
    }
  }

  function resumeTrack(getElement: () => HTMLAudioElement | null) {
    const element = getElement();
    const current = graph.current;
    if (!element || !current || (current.element !== element && !requested.current)) return;
    if (current.context.state === "running") {
      connectTrack(element);
      return;
    }
    void current.context
      .resume()
      .then(() => {
        if (graph.current === current && getElement() === element) connectTrack(element);
      })
      .catch(() => {
        if (requested.current) unavailable();
      });
  }

  return { analyser, enabled, message, toggle, connectTrack, disconnectPreviousTrack, resumeTrack };
}
