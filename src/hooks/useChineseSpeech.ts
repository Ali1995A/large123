import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

function pickChineseVoice(voices: SpeechSynthesisVoice[]) {
  const preferredLangs = ["zh-CN", "zh-Hans-CN", "zh-HK", "zh-TW", "zh"];

  for (const lang of preferredLangs) {
    const exact = voices.find((v) => v.lang === lang);
    if (exact) return exact;
  }

  const prefix = voices.find((v) => v.lang?.toLowerCase().startsWith("zh"));
  return prefix ?? null;
}

export function useChineseSpeech() {
  const [available] = useState(() => {
    if (typeof window === "undefined") return false;
    return "speechSynthesis" in window;
  });
  const [hasUserGesture, setHasUserGesture] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    const update = () => {
      voicesRef.current = window.speechSynthesis.getVoices() ?? [];
    };

    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const unlock = useCallback(() => {
    setHasUserGesture(true);
  }, []);

  const canSpeak = useMemo(() => available && hasUserGesture, [available, hasUserGesture]);

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;
      if (!hasUserGesture) return;

      window.speechSynthesis.cancel();

      await new Promise<void>((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "zh-CN";
        utter.rate = options.rate ?? 0.9;
        utter.pitch = options.pitch ?? 1.05;
        utter.volume = options.volume ?? 1;

        const voice = pickChineseVoice(voicesRef.current);
        if (voice) utter.voice = voice;

        utter.onend = () => resolve();
        utter.onerror = () => resolve();

        window.speechSynthesis.speak(utter);
      });
    },
    [hasUserGesture],
  );

  return { available, hasUserGesture, canSpeak, unlock, speak };
}
