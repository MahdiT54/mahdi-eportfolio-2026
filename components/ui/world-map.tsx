"use client";

import DottedMap from "dotted-map";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

type DotPoint = {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

type DotRoute = {
  start: DotPoint;
  end: DotPoint;
};

interface MapProps {
  dots?: DotRoute[];
  lineColor?: string;
  showLabels?: boolean;
}

const getPointKey = ({ lat, lng, label }: DotPoint) =>
  `${label ?? ""}:${lat.toFixed(4)},${lng.toFixed(4)}`;

export default function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
  showLabels = false,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);
  const map = new DottedMap({ height: 100, grid: "diagonal" });

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const svgMap = map.getSVG({
    radius: 0.22,
    color: isDark ? "#FFFFFF40" : "#00000040",
    shape: "circle",
    backgroundColor: isDark ? "black" : "white",
  });

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const labeledPoints = useMemo(() => {
    const pointsWithLabels = dots
      .flatMap((dot) => [dot.start, dot.end])
      .filter((point): point is DotPoint & { label: string } =>
        Boolean(point.label),
      );

    return Array.from(
      new Map(
        pointsWithLabels.map((point) => [getPointKey(point), point] as const),
      ).values(),
    );
  }, [dots]);

  return (
    <div className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg  relative font-sans">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        role="img"
        aria-label="Global connection map"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        <title>Global connection map</title>
        {dots.map((dot, i) => {
          const routeKey = `${getPointKey(dot.start)}->${getPointKey(dot.end)}`;
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-${routeKey}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: 1,
                  delay: 0.5 * i,
                  ease: "easeOut",
                }}
              ></motion.path>
            </g>
          );
        })}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot) => {
          const routeKey = `${getPointKey(dot.start)}->${getPointKey(dot.end)}`;
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const startColor = dot.start.color || lineColor;
          const endColor = dot.end.color || lineColor;

          return (
            <g key={`points-${routeKey}`}>
              <g>
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r="2"
                  fill={startColor}
                />
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r="2"
                  fill={startColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="2"
                    to="8"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
              <g>
                <circle cx={endPoint.x} cy={endPoint.y} r="2" fill={endColor} />
                <circle
                  cx={endPoint.x}
                  cy={endPoint.y}
                  r="2"
                  fill={endColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="2"
                    to="8"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          );
        })}

        {showLabels &&
          labeledPoints.map((point) => {
            const position = projectPoint(point.lat, point.lng);
            const labelColor = point.color || (isDark ? "#e5e7eb" : "#111827");

            return (
              <text
                key={`label-${getPointKey(point)}`}
                x={position.x + 6}
                y={position.y - 6}
                fill={labelColor}
                fontSize="9"
                fontWeight="600"
                stroke={isDark ? "#000000cc" : "#ffffffdd"}
                strokeWidth="2"
                paintOrder="stroke"
              >
                {point.label}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
