"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  type AreaData,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";

import { formatNumber } from "@/lib/money/format";

import type { CandleView, ObservationView } from "../types";

interface PriceHistoryChartProps {
  kind: "observations" | "candles";
  points: ObservationView[] | CandleView[];
}

function toUnixSeconds(iso: string): UTCTimestamp | null {
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000) as UTCTimestamp;
}

// Display-only chart data: Number() is safe here (no money arithmetic).
function toAreaData(observations: ObservationView[]): AreaData<UTCTimestamp>[] {
  const byTime = new Map<number, number>();
  for (const observation of observations) {
    const time = toUnixSeconds(observation.source_at);
    if (time === null) continue;
    const price = Number(observation.price);
    if (!Number.isFinite(price)) continue;
    byTime.set(time, price);
  }
  return [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, value]) => ({ time: time as UTCTimestamp, value }));
}

function toCandlestickData(
  candles: CandleView[],
): CandlestickData<UTCTimestamp>[] {
  const byTime = new Map<number, CandlestickData<UTCTimestamp>>();
  for (const candle of candles) {
    const time = toUnixSeconds(candle.opened_at);
    if (time === null) continue;
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);
    if (![open, high, low, close].every(Number.isFinite)) continue;
    byTime.set(time, { time: time as UTCTimestamp, open, high, low, close });
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

export function PriceHistoryChart({ kind, points }: PriceHistoryChartProps) {
  const t = useTranslations("markets");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;

    const dark = document.documentElement.classList.contains("dark");
    const chart = createChart(container, {
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: dark ? "#a1a1aa" : "#52525b",
      },
      localization: {
        priceFormatter: (price: number) => formatNumber(String(price), locale),
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    if (kind === "candles") {
      const series = chart.addSeries(CandlestickSeries);
      series.setData(toCandlestickData(points as CandleView[]));
    } else {
      const series = chart.addSeries(AreaSeries, {
        lineWidth: 2,
        topColor: "rgba(37, 99, 235, 0.45)",
        bottomColor: "rgba(37, 99, 235, 0.02)",
      });
      series.setData(toAreaData(points as ObservationView[]));
    }
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [kind, points, locale]);

  if (points.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border text-sm text-muted-foreground">
        {t("noHistory")}
      </div>
    );
  }

  return <div ref={containerRef} className="h-[400px] w-full" />;
}
