const sensorReadings = [
  { time: "09:00", value: 42 },
  { time: "09:30", value: 48 },
  { time: "10:00", value: 45 },
  { time: "10:30", value: 58 },
  { time: "11:00", value: 55 },
  { time: "11:30", value: 64 },
  { time: "12:00", value: 61 },
  { time: "12:30", value: 68 },
  { time: "13:00", value: 66 },
  { time: "13:30", value: 74 },
  { time: "14:00", value: 72 },
  { time: "14:30", value: 78 },
]

const chartWidth = 960
const chartHeight = 300
const chartPadding = { top: 24, right: 18, bottom: 40, left: 48 }
const minScale = 20
const maxScale = 100

const points = sensorReadings.map((reading, index) => {
  const x =
    chartPadding.left +
    (index / (sensorReadings.length - 1)) *
      (chartWidth - chartPadding.left - chartPadding.right)
  const y =
    chartPadding.top +
    ((maxScale - reading.value) / (maxScale - minScale)) *
      (chartHeight - chartPadding.top - chartPadding.bottom)

  return { ...reading, x, y }
})

const linePath = points
  .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
  .join(" ")

const areaPath = `${linePath} L ${points.at(-1)?.x} ${
  chartHeight - chartPadding.bottom
} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`

function StatusDot() {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </span>
  )
}

function SensorChart() {
  const gridValues = [100, 80, 60, 40, 20]

  return (
    <div className="mt-8 overflow-x-auto pb-1">
      <svg
        className="h-[300px] min-w-[720px] w-full"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="오전 9시부터 오후 2시 30분까지 굽힘 센서값이 42도에서 78도로 변화한 선 그래프"
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

        {gridValues.map((value) => {
          const y =
            chartPadding.top +
            ((maxScale - value) / (maxScale - minScale)) *
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
                {value}°
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill="url(#sensor-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="#5B61F6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={point.time}>
            {(index % 2 === 0 || index === points.length - 1) && (
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
                Flex Monitor
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
              <span className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
                <StatusDot />
                정상
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
                <span className="text-sm font-bold">Flex Monitor</span>
              </div>
              <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <StatusDot />
                센서 연결됨
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
                <span>2025년 6월 12일</span>
                <span className="h-3 w-px bg-slate-300" />
                <span>14:30 기준</span>
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
                        실시간 굽힘 각도
                      </p>
                    </div>
                    <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
                      LIVE
                    </span>
                  </div>

                  <div className="my-auto py-7">
                    <div className="flex items-end gap-2">
                      <strong className="text-[72px] font-bold leading-none tracking-[-0.07em] sm:text-[82px]">
                        78
                      </strong>
                      <span className="mb-2 text-3xl font-medium text-indigo-100">
                        °
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className="rounded-md bg-white/14 px-2 py-1 text-xs font-bold">
                        +6°
                      </span>
                      <span className="text-xs text-indigo-100">
                        30분 전보다 증가
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                    <div className="h-full w-[78%] rounded-full bg-white" />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-medium text-indigo-200">
                    <span>0°</span>
                    <span>측정 범위</span>
                    <span>100°</span>
                  </div>
                </div>
              </article>

              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                {[
                  { label: "평균값", value: "62.6°", note: "오늘 기준" },
                  { label: "최솟값", value: "42°", note: "09:00 측정" },
                  { label: "최댓값", value: "78°", note: "14:30 측정" },
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
                      <StatusDot />
                      <p className="text-lg font-bold text-slate-800">
                        안정적으로 측정 중
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      신호 강도와 응답 속도가 정상 범위입니다.
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
                    시간별 센서 변화
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    오늘 측정된 굽힘 각도 추이
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    className="rounded-lg bg-white px-3.5 py-2 text-[#4C51D9] shadow-sm"
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-3.5 py-2 text-slate-400"
                  >
                    7일
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-3.5 py-2 text-slate-400"
                  >
                    30일
                  </button>
                </div>
              </div>
              <SensorChart />
            </section>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              현재 화면은 예시 데이터로 표시되고 있습니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
