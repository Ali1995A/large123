"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NUMBER_STEPS } from "@/lib/steps";
import { chooseReference } from "@/lib/references";
import { useChineseSpeech } from "@/hooks/useChineseSpeech";
import { CubeStage } from "@/components/CubeStage";
import { estimateBlockDimensionsCm } from "@/lib/blockLayout";

function Icon({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-7 w-7"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function AppShell() {
  const [index, setIndex] = useState(0);
  const step = NUMBER_STEPS[index]!;
  const sizeCm = useMemo(() => estimateBlockDimensionsCm(step.value).maxCm, [step.value]);
  const reference = useMemo(() => chooseReference(sizeCm), [sizeCm]);

  const { hasUserGesture, unlock, speak } = useChineseSpeech();

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener("resize", setAppHeight, { passive: true });
    return () => window.removeEventListener("resize", setAppHeight);
  }, []);

  const goNext = useCallback(() => {
    unlock();
    const nextIndex = (index + 1) % NUMBER_STEPS.length;
    const next = NUMBER_STEPS[nextIndex]!;
    setIndex(nextIndex);
    void speak(next.spoken);
  }, [index, speak, unlock]);

  const goPrev = useCallback(() => {
    unlock();
    const prevIndex = (index - 1 + NUMBER_STEPS.length) % NUMBER_STEPS.length;
    const prev = NUMBER_STEPS[prevIndex]!;
    setIndex(prevIndex);
    void speak(prev.spoken);
  }, [index, speak, unlock]);

  const replay = useCallback(() => {
    unlock();
    void speak(step.spoken);
  }, [speak, step.spoken, unlock]);

  const reset = useCallback(() => {
    unlock();
    setIndex(0);
    void speak(NUMBER_STEPS[0]!.spoken);
  }, [speak, unlock]);

  return (
    <div className="min-h-[var(--app-height,100dvh)] w-full bg-gradient-to-b from-rose-50 via-violet-50/40 to-rose-100 text-rose-950">
      <div className="mx-auto flex min-h-[var(--app-height,100dvh)] w-full flex-col px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-[max(env(safe-area-inset-top),16px)]">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-rose-200 backdrop-blur active:scale-[0.98]"
            aria-label="重来"
          >
            <Icon path="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
          </button>

          <div className="text-center">
            <div className="text-xs font-medium text-rose-500">1cm 小方块</div>
            <div className="text-lg font-semibold tracking-tight">{step.digits}</div>
          </div>

          <button
            type="button"
            onClick={replay}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-rose-200 backdrop-blur active:scale-[0.98]"
            aria-label="播放声音"
          >
            <Icon path="M11 5 6 9H3v6h3l5 4V5Zm8.5 6a4.5 4.5 0 0 1 0 2m-2-6a10 10 0 0 1 0 10" />
          </button>
        </header>

        <main className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] bg-white/85 shadow-sm ring-1 ring-rose-200">
            <CubeStage value={step.value} reference={reference} />

            {!hasUserGesture && (
              <button
                type="button"
                onClick={() => {
                  unlock();
                  void speak(step.spoken);
                }}
                className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm"
                aria-label="开始"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-pink-400 to-rose-500 text-white shadow-lg">
                    <Icon
                      className="h-10 w-10"
                      path="M8 5v14l11-7-11-7Z"
                    />
                  </div>
                  <div className="text-sm font-medium text-rose-600">
                    点一下开始（会说中文）
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-xs font-medium text-rose-500">参照物</div>
              <div className="text-base font-semibold">{reference.name}</div>
            </div>

            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-16 items-center justify-center gap-2 rounded-3xl bg-white/80 px-5 text-lg font-semibold text-rose-700 shadow-lg shadow-rose-200 active:scale-[0.99] ring-1 ring-rose-200"
              aria-label="上一步"
            >
              <Icon path="M14 17l-5-5 5-5" className="h-7 w-7" />
              <span className="tracking-tight">上一步</span>
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-16 flex-1 items-center justify-center gap-3 rounded-3xl bg-gradient-to-b from-pink-500 to-rose-600 px-6 text-xl font-semibold text-white shadow-lg shadow-rose-200 active:scale-[0.99]"
              aria-label="下一步"
            >
              <span className="tracking-tight">下一步</span>
              <Icon path="M10 17l5-5-5-5" className="h-8 w-8" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
