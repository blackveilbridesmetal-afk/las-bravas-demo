import React from 'react';

export interface BarDatum {
  label: string;
  value: number;
  sublabel?: string;
  accent?: 'orange' | 'plomo' | 'sage';
}

interface DonutGaugeChartProps {
  percent: number;
  title: string;
  centerLabel: string;
  centerSublabel: string;
  filledLabel: string;
  remainingLabel: string;
}

export const DonutGaugeChart: React.FC<DonutGaugeChartProps> = ({
  percent,
  title,
  centerLabel,
  centerSublabel,
  filledLabel,
  remainingLabel,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-label={title}>
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#EFEFF1"
            strokeWidth="12"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#B26337"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono-tabular text-2xl font-bold text-[#23272E]">
            {centerLabel}
          </span>
          <span className="text-[11px] font-medium text-[#5C626D]">
            {centerSublabel}
          </span>
        </div>
      </div>

      <div className="w-full space-y-2.5 text-xs">
        <div className="flex items-center justify-between border-b border-[#EFEFF1] pb-2">
          <span className="flex items-center gap-2 text-[#5C626D]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#B26337]" />
            Plazas cubiertas
          </span>
          <strong className="font-mono-tabular text-[#23272E]">{filledLabel}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[#5C626D]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#D8DCE0]" />
            Por cubrir
          </span>
          <strong className="font-mono-tabular text-[#23272E]">{remainingLabel}</strong>
        </div>
      </div>
    </div>
  );
};

interface HorizontalDistributionBarsProps {
  items: BarDatum[];
  maxOverride?: number;
  unitLabel?: string;
}

export const HorizontalDistributionBars: React.FC<HorizontalDistributionBarsProps> = ({
  items,
  maxOverride,
  unitLabel = '',
}) => {
  const maxVal = Math.max(
    1,
    maxOverride ?? Math.max(...items.map((i) => i.value), 1)
  );

  const colorMap: Record<NonNullable<BarDatum['accent']>, string> = {
    orange: 'bg-[#B26337]',
    plomo: 'bg-[#7A818D]',
    sage: 'bg-[#3D7A5A]',
  };

  return (
    <div className="min-w-0 space-y-3">
      {items.map((item) => {
        const pct = Math.min(100, Math.round((item.value / maxVal) * 100));
        const barColor = colorMap[item.accent ?? 'orange'];
        return (
          <div key={item.label} className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium text-[#23272E]" title={item.label}>
                {item.label}
              </span>
              <span className="font-mono-tabular shrink-0 text-[#5C626D]">
                <strong className="text-[#23272E]">
                  {item.value}
                  {unitLabel}
                </strong>
                {item.sublabel ? ` · ${item.sublabel}` : ''}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export interface GroupedBoardDatum {
  name: string;
  proposals: number;
  candidates: number;
  shortlisted: number;
}

export const GroupedBoardsChart: React.FC<{ data: GroupedBoardDatum[] }> = ({ data }) => {
  const maxY = Math.max(
    10,
    ...data.map((d) => Math.max(d.proposals, d.candidates, d.shortlisted))
  );
  const chartHeight = 176;
  const topPad = 18;
  const bottomPad = 42;
  const plotH = chartHeight - topPad - bottomPad;
  const colWidth = 92;
  const svgWidth = Math.max(520, data.length * colWidth + 24);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-5 text-xs text-[#5C626D]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#9EA4AE]" />
          Propuestas enviadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#B26337]" />
          Candidatos recibidos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#3D7A5A]" />
          Preseleccionados IA
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          className="h-48 w-full min-w-[500px]"
          role="img"
          aria-label="Comparativa de propuestas, candidatos recibidos y preseleccionados por bolsa de trabajo"
        >
          {/* Subtle horizontal gridlines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = topPad + plotH * (1 - ratio);
            const labelVal = Math.round(maxY * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={26}
                  y1={y}
                  x2={svgWidth - 8}
                  y2={y}
                  stroke="#EFEFF1"
                  strokeWidth="1"
                />
                <text
                  x={20}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#7A818D"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {data.map((d, idx) => {
            const groupX = 36 + idx * colWidth;
            const barW = 16;
            const gap = 4;

            const hProp = Math.max(2, (d.proposals / maxY) * plotH);
            const hCand = Math.max(2, (d.candidates / maxY) * plotH);
            const hShort = Math.max(2, (d.shortlisted / maxY) * plotH);

            const baseY = topPad + plotH;
            const shortName =
              d.name.length > 13 ? `${d.name.slice(0, 12)}…` : d.name;

            return (
              <g key={d.name}>
                {/* Proposals */}
                <rect
                  x={groupX}
                  y={baseY - hProp}
                  width={barW}
                  height={hProp}
                  rx="3"
                  fill="#9EA4AE"
                />
                <text
                  x={groupX + barW / 2}
                  y={baseY - hProp - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#5C626D"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.proposals}
                </text>

                {/* Candidates */}
                <rect
                  x={groupX + barW + gap}
                  y={baseY - hCand}
                  width={barW}
                  height={hCand}
                  rx="3"
                  fill="#B26337"
                />
                <text
                  x={groupX + barW + gap + barW / 2}
                  y={baseY - hCand - 4}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#8C4722"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.candidates}
                </text>

                {/* Shortlisted */}
                <rect
                  x={groupX + (barW + gap) * 2}
                  y={baseY - hShort}
                  width={barW}
                  height={hShort}
                  rx="3"
                  fill="#3D7A5A"
                />
                <text
                  x={groupX + (barW + gap) * 2 + barW / 2}
                  y={baseY - hShort - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#3D7A5A"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.shortlisted}
                </text>

                <text
                  x={groupX + barW * 1.5 + gap}
                  y={baseY + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#23272E"
                >
                  {shortName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface PsychRadarAxis {
  label: string;
  value: number;
}

export const PsychRadarChart: React.FC<{
  axes: PsychRadarAxis[];
  benchmark?: number;
}> = ({ axes, benchmark = 80 }) => {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 72;
  const count = axes.length;

  const pointAt = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, pct)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const toPoly = (vals: number[]) =>
    vals
      .map((v, i) => {
        const pt = pointAt(i, v);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  const candidatePoly = toPoly(axes.map((a) => a.value));
  const benchmarkPoly = toPoly(axes.map(() => benchmark));

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-60 w-60"
        role="img"
        aria-label="Perfil psicométrico de 5 dimensiones comparado con estándar minero"
      >
        {/* Concentric pentagons */}
        {[25, 50, 75, 100].map((ring) => (
          <polygon
            key={ring}
            points={toPoly(axes.map(() => ring))}
            fill="none"
            stroke="#E2E4E8"
            strokeWidth="1"
          />
        ))}

        {/* Radial spokes */}
        {axes.map((_, idx) => {
          const outer = pointAt(idx, 100);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#E2E4E8"
              strokeWidth="1"
            />
          );
        })}

        {/* Standard benchmark dashed polygon */}
        <polygon
          points={benchmarkPoly}
          fill="none"
          stroke="#7A818D"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Candidate score area */}
        <polygon
          points={candidatePoly}
          fill="rgba(178, 99, 55, 0.22)"
          stroke="#B26337"
          strokeWidth="2"
        />

        {/* Data dots + cleanly offset axis labels */}
        {axes.map((axis, idx) => {
          const dot = pointAt(idx, axis.value);
          const lbl = pointAt(idx, 130);
          const anchor =
            Math.abs(lbl.x - cx) < 12 ? 'middle' : lbl.x > cx ? 'start' : 'end';
          const yLabel = lbl.y < cy - 60 ? lbl.y - 8 : lbl.y - 3;
          const yVal = yLabel + 12;

          return (
            <g key={axis.label}>
              <circle cx={dot.x} cy={dot.y} r="3.5" fill="#B26337" />
              <text
                x={lbl.x}
                y={yLabel}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="600"
                fill="#23272E"
              >
                {axis.label}
              </text>
              <text
                x={lbl.x}
                y={yVal}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="#B26337"
                fontFamily="JetBrains Mono, monospace"
              >
                {axis.value}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex items-center gap-4 text-[11px] text-[#5C626D]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#B26337]" />
          Candidato
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 border-t-2 border-dashed border-[#7A818D]" />
          Estándar Faena ({benchmark} pts)
        </span>
      </div>
    </div>
  );
};
