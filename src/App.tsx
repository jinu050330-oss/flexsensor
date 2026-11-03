import { useEffect, useState } from "react"
import { supabase } from "./supabase"

type SensorReading = {
  id: string
  createdAt: string
  time: string
  value: number
}
type DatabaseReading = {
  id: number | string
  created_at: string
  value: number | null
}

const chartWidth = 960
const chartHeight = 300
const chartPadding = { top: 24, right: 18, bottom: 40, left: 48 }
const minScale = 20
const maxScale = 100

function toSensorReading(row: DatabaseReading): SensorReading {
  const createdAt = row.created_at || new Date().toISOString()
  return {
    id: String(row.id),
    createdAt,
    time: new Date(createdAt).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    value: Number(row.value),
  }
}

function mergeReadings(...groups: SensorReading[][]): SensorReading[] {
  const readingsById = new Map<string, SensorReading>()
  for (const group of groups) {
    for (const reading of group) readingsById.set(reading.id, reading)
  }
  return [...readingsById.values()]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-100)
}

function StatusDot() {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </span>
  )
}

function SensorChart({ readings }: { readings: SensorReading[] }) {
  const gridValues = [100, 80, 60, 40, 20]
  const values = readings.map((reading) => reading.value)
  const rawMin = values.length ? Math.min(...values) : minScale
  const rawMax = values.length ? Math.max(...values) : maxScale
  const padding = Math.max((rawMax - rawMin) * 0.1, 1)
  const scaleMin = Math.min(0, rawMin - padding)
  const scaleMax = rawMax + padding
  const points = readings.map((reading, index) => {
    const x =
      chartPadding.left +
      (readings.length < 2
        ? 1
        : index / (readings.length - 1)) *
        (chartWidth - chartPadding.left - chartPadding.right)
    const y =
      chartPadding.top +
      ((scaleMax - reading.value) / (scaleMax - scaleMin)) *
        (chartHeight - chartPadding.top - chartPadding.bottom)
    return { ...reading, x, y }
  })
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")
  const areaPath = points.length
    ? `${linePath} L ${points.at(-1)?.x} ${chartHeight - chartPadding.bottom} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`
    : ""
  const labelStep = Math.max(1, Math.ceil(points.length / 6))

  return (
    <div className="mt-8 overflow-x-auto pb-1">
      <svg
        className="h-[300px] min-w-[720px] w-full"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="최근 센서값 변화 그래프"
      >
        <defs>
          <linearGradient id="sensor-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B61F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#5B61F6" stopOpacity="0" />
          </linearGradient>
          <filter
            id="point-shadow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#4338CA"
              floodOpacity="0.22"
            />
          </filter>
        </defs>

        {Array.from(
          { length: values.length ? 5 : gridValues.length },
          (_, index) => {
          const value = values.length
            ? scaleMax - ((scaleMax - scaleMin) * index) / 4
            : gridValues[index]
          const y =
            chartPadding.top +
            ((scaleMax - value) / (scaleMax - scaleMin)) *
              (chartHeight - chartPadding.top - chartPadding.bottom)

          return (
            <g key={value}>
              <line
                x1={chartPadding.left}
                x2={chartWidth - chartPadding.right}
                y1={y}
                y2={y}
                stroke="#E8E9F0"
                strokeDasharray="4 5"
              />
              <text
                x={chartPadding.left - 14}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px]"
              >
                {Number.isInteger(value) ? value : value.toFixed(1)}
              </text>
            </g>
          )
          },
        )}

        {areaPath && <path d={areaPath} fill="url(#sensor-area)" />}
        <path
          d={linePath}
          fill="none"
          stroke="#5B61F6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`${point.time}-${index}`}>
            {(index % labelStep === 0 || index === points.length - 1) && (
              <text
                x={point.x}
                y={chartHeight - 12}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === points.length - 1
                      ? "end"
                      : "middle"
                }
                className="fill-slate-400 text-[11px]"
              >
                {point.time}
              </text>
            )}
            <circle
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 6 : 4}
              fill="white"
              stroke="#5B61F6"
              strokeWidth={index === points.length - 1 ? 4 : 2.5}
              filter={
                index === points.length - 1 ? "url(#point-shadow)" : undefined
              }
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function App() {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting")
  const [statusMessage, setStatusMessage] = useState(
    "Supabase에 연결하는 중입니다.",
  )
  const [queryError, setQueryError] = useState("")
  const currentReading = readings.at(-1)
  const values = readings.map((reading) => reading.value)
  const average = values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null
  const minimum = values.length ? Math.min(...values) : null
  const maximum = values.length ? Math.max(...values) : null

  useEffect(() => {
    let active = true
    if (!supabase) {
      setConnectionStatus("error")
      setStatusMessage(
        "VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.",
      )
      return
    }

    async function loadRecentReadings() {
      const { data, error } = await supabase
        .from("readings")
        .select("id, created_at, value")
        .order("created_at", { ascending: false })
        .limit(100)

      if (!active) return
      if (error) {
        setQueryError(error.message)
        setStatusMessage(
          "최근 데이터를 읽지 못했습니다. readings 테이블의 SELECT 정책을 확인하세요.",
        )
        return
      }

      const recentReadings = (data ?? [])
        .filter(
          (row) => row.value !== null && Number.isFinite(Number(row.value)),
        )
        .map((row) => toSensorReading(row as DatabaseReading))
        .reverse()
      setReadings((previous) => mergeReadings(recentReadings, previous))
      setQueryError("")
    }

    setStatusMessage("최근 Supabase 데이터를 불러오는 중입니다.")
    void loadRecentReadings()

    const channel = supabase
      .channel("readings-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "readings" },
        (payload) => {
          const row = payload.new as DatabaseReading
          if (row.value === null || !Number.isFinite(Number(row.value))) return
          const reading = toSensorReading(row)
          setReadings((previous) => mergeReadings(previous, [reading]))
        },
      )
      .subscribe((status) => {
        if (!active) return
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
          setStatusMessage("새 readings 행을 Realtime으로 받고 있습니다.")
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("error")
          setStatusMessage(
            "Realtime 연결에 실패했습니다. Supabase Realtime 설정과 SELECT 정책을 확인하세요.",
          )
        }
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#5B61F6] text-sm font-bold text-white shadow-[0_8px_20px_rgba(91,97,246,0.24)]">
              FS
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight">
                Flexsensor
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Sensor workspace
              </p>
            </div>
          </div>

          <nav className="mt-11" aria-label="주요 메뉴">
            <p className="px-3 text-[10px] font-bold tracking-[0.14em] text-slate-400">
              MENU
            </p>
            <a
              href="#dashboard"
              aria-current="page"
              className="mt-3 flex items-center gap-3 rounded-xl bg-[#EEF0FF] px-3.5 py-3 text-sm font-semibold text-[#4C51D9]"
            >
              <span
                className="grid h-6 w-6 grid-cols-2 gap-1 rounded-md bg-[#5B61F6] p-1.5"
                aria-hidden="true"
              >
                <span className="rounded-[1px] bg-white" />
                <span className="rounded-[1px] bg-white/70" />
                <span className="rounded-[1px] bg-white/70" />
                <span className="rounded-[1px] bg-white" />
              </span>
              대시보드
            </a>
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                연결 상태
              </span>
              <span
                className={`flex items-center gap-2 text-[11px] font-semibold ${connectionStatus === "connected" ? "text-emerald-600" : "text-slate-400"}`}
              >
                {connectionStatus === "connected" && <StatusDot />}
                {connectionStatus === "connected"
                  ? "연결됨"
                  : connectionStatus === "connecting"
                    ? "연결 중"
                    : "연결 대기"}
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Flex Sensor 01
              <br />
              마지막 동기화 · 방금 전
            </p>
          </div>
        </aside>

        <main id="dashboard" className="min-w-0 flex-1 lg:ml-[248px]">
          <header className="border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-[1240px] items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#5B61F6] text-xs font-bold text-white">
                  FS
                </div>
                <span className="text-sm font-bold">Flexsensor</span>
              </div>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${connectionStatus === "connected" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : connectionStatus === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-500"}`}
                >
                  {connectionStatus === "connected" && <StatusDot />}
                  {connectionStatus === "connected"
                    ? "Supabase 연결됨"
                    : connectionStatus === "connecting"
                      ? "Supabase 연결 중"
                      : "Supabase 연결 오류"}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.13em] text-[#5B61F6]">
                  FLEX SENSOR 01
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-900 sm:text-[32px]">
                  센서 모니터링
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  굽힘 센서의 상태와 변화를 한눈에 확인하세요.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>
                  {currentReading
                    ? new Date(currentReading.createdAt).toLocaleDateString("ko-KR")
                    : new Date().toLocaleDateString("ko-KR")}
                </span>
                <span className="h-3 w-px bg-slate-300" />
                <span>
                  {currentReading
                    ? new Date(currentReading.createdAt).toLocaleTimeString("ko-KR")
                    : new Date().toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} 기준
                </span>
              </div>
            </div>

            <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_1.95fr]">
              <article className="relative min-h-[300px] overflow-hidden rounded-[24px] bg-[#555BF1] p-7 text-white shadow-[0_18px_44px_rgba(67,56,202,0.17)] sm:p-8">
                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-white/[0.06]" />
                <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/[0.04]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-100">
                        현재 센서값
                      </p>
                      <p className="mt-1 text-xs text-indigo-200">
                        {readings.length
                          ? "readings 최신 값"
                          : "Supabase 값 대기 중"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
                      SUPABASE
                    </span>
                  </div>

                  <div className="my-auto py-7">
                    <div className="flex items-end gap-2">
                      <strong className="max-w-full break-all text-[64px] font-bold leading-none sm:text-[82px]">
                        {currentReading ? currentReading.value : "--"}
                      </strong>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-xs text-indigo-100">
                        {readings.length > 1
                          ? `이전 값 대비 ${currentReading!.value - readings.at(-2)!.value >= 0 ? "+" : ""}${Number((currentReading!.value - readings.at(-2)!.value).toFixed(2))}`
                          : readings.length === 1
                            ? "최근 데이터 1개"
                            : "저장된 데이터 없음"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-medium text-indigo-200">
                    <span>최근 값</span>
                    <span>
                      {currentReading?.time ?? "데이터 대기 중"}
                    </span>
                  </div>
                </div>
              </article>

              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                {[
                  {
                    label: "평균값",
                    value: average === null ? "--" : Number(average.toFixed(2)).toString(),
                    note: "최근 readings 기준",
                  },
                  {
                    label: "최솟값",
                    value: minimum === null ? "--" : minimum.toString(),
                    note: "최근 readings 기준",
                  },
                  {
                    label: "최댓값",
                    value: maximum === null ? "--" : maximum.toString(),
                    note: "최근 readings 기준",
                  },
                ].map((item, index) => (
                  <article
                    key={item.label}
                    className="flex min-h-[140px] flex-col rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.035)] sm:p-6"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          index === 0
                            ? "bg-[#5B61F6]"
                            : index === 1
                              ? "bg-cyan-400"
                              : "bg-amber-400"
                        }`}
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-auto text-xl font-bold tracking-[-0.04em] text-slate-800 sm:text-[26px]">
                      {item.value}
                    </p>
                    <p className="mt-1.5 text-[10px] text-slate-400 sm:text-[11px]">
                      {item.note}
                    </p>
                  </article>
                ))}

                <article className="col-span-3 flex min-h-[140px] items-center justify-between rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.035)] sm:px-7">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      센서 상태
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      {connectionStatus === "connected" ? (
                        <StatusDot />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      )}
                      <p className="text-lg font-bold text-slate-800">
                        {connectionStatus === "connected"
                          ? "Realtime 구독 중"
                          : connectionStatus === "error"
                            ? "연결을 확인해 주세요"
                            : "Supabase 연결 중"}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {queryError || statusMessage}
                    </p>
                  </div>
                  <div
                    className="hidden items-end gap-1.5 sm:flex"
                    aria-hidden="true"
                  >
                    {[16, 26, 21, 36, 31, 44, 52, 47, 60].map(
                      (height, index) => (
                        <span
                          key={index}
                          className="w-1.5 rounded-full bg-[#5B61F6]"
                          style={{ height, opacity: 0.28 + index * 0.075 }}
                        />
                      ),
                    )}
                  </div>
                </article>
              </div>
            </section>

            <section className="mt-5 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.035)] sm:p-7 lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-[-0.025em] text-slate-900">
                    최근 센서 변화
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Supabase readings 테이블의 최근 value
                  </p>
                </div>
                <div className="rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-500">
                  최근 100개 · 현재 {readings.length}개
                </div>
              </div>
              <SensorChart readings={readings} />
            </section>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              readings의 최신 100개 value를 표시하며, 새 행은 Realtime으로 반영됩니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
