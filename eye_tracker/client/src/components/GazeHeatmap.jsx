
import { useEffect, useRef } from "react";

export default function GazeHeatmap({
  samples = [],
  opacity = 0.7,
  radius = 48,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvas?.parentElement;

    if (!canvas || !wrapper) return undefined;

    const draw = () => {
      const bounds = wrapper.getBoundingClientRect();
      const passageText = wrapper.querySelector("p");
      const textBounds = passageText?.getBoundingClientRect();
      const width = bounds.width;
      const height = bounds.height;
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);

      if (!width || !height || !textBounds) return;

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const validSamples = samples.filter((sample) => {
        const xValue = sample.heatmap_x;
        const yValue = sample.heatmap_y;
        if (
          xValue === null ||
          xValue === undefined ||
          xValue === "" ||
          yValue === null ||
          yValue === undefined ||
          yValue === ""
        ) {
          return false;
        }

        const x = Number(sample.heatmap_x);
        const y = Number(sample.heatmap_y);
        const faceValue = sample.face_detected;
        const faceMissing =
          faceValue === undefined || faceValue === null || faceValue === "";

        const faceDetected =
          faceValue === true ||
          faceValue === 1 ||
          faceValue === "1" ||
          faceValue === "true";

        return (
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          x >= 0 &&
          x <= 1 &&
          y >= 0 &&
          y <= 1 &&
          (faceMissing || faceDetected)
        );
      }).map((sample, index) => ({
        sample,
        index,
        timestamp: Number(sample.timestamp_seconds),
      })).sort((a, b) => {
        const aValid = Number.isFinite(a.timestamp);
        const bValid = Number.isFinite(b.timestamp);
        if (!aValid && !bValid) return a.index - b.index;
        if (!aValid) return 1;
        if (!bValid) return -1;
        return a.timestamp - b.timestamp;
      });

      const intervals = validSamples.slice(1)
        .map((entry, index) => entry.timestamp - validSamples[index].timestamp)
        .filter((interval) => Number.isFinite(interval) && interval > 0)
        .sort((a, b) => a - b);
      const typicalInterval =
        intervals.length > 0
          ? intervals[Math.floor(intervals.length / 2)]
          : 1;
      const fallbackWeight = Math.min(0.1, Math.max(0.01, typicalInterval));

      const density = new Float32Array(pixelWidth * pixelHeight);
      const kernelRadius = Math.max(1, Math.round(radius * dpr));
      const kernelRadiusSquared = kernelRadius * kernelRadius;
      const sigma = kernelRadius / 2.5;
      const twoSigmaSquared = 2 * sigma * sigma;

      for (let sampleIndex = 0; sampleIndex < validSamples.length; sampleIndex += 1) {
        const { sample, timestamp } = validSamples[sampleIndex];
        const nextTimestamp = validSamples[sampleIndex + 1]?.timestamp;
        const interval =
          Number.isFinite(timestamp) && Number.isFinite(nextTimestamp)
            ? nextTimestamp - timestamp
            : fallbackWeight;
        const weight = Number.isFinite(interval) && interval > 0
          ? Math.min(0.1, interval)
          : fallbackWeight;
        const normalizedWeight = weight / fallbackWeight;
        const textOffsetX = textBounds.left - bounds.left;
        const textOffsetY = textBounds.top - bounds.top;
        const centerX = Math.min(
          pixelWidth - 1,
          Math.round((textOffsetX + Number(sample.heatmap_x) * textBounds.width) * dpr)
        );
        const centerY = Math.min(
          pixelHeight - 1,
          Math.round((textOffsetY + Number(sample.heatmap_y) * textBounds.height) * dpr)
        );
        const left = Math.max(0, centerX - kernelRadius);
        const right = Math.min(pixelWidth - 1, centerX + kernelRadius);
        const top = Math.max(0, centerY - kernelRadius);
        const bottom = Math.min(pixelHeight - 1, centerY + kernelRadius);

        for (let y = top; y <= bottom; y += 1) {
          for (let x = left; x <= right; x += 1) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > kernelRadiusSquared) continue;

            const index = y * pixelWidth + x;
            density[index] += normalizedWeight * Math.exp(
              -distanceSquared / twoSigmaSquared
            );
          }
        }
      }

      let maxDensity = 0;
      for (const value of density) {
        maxDensity = Math.max(maxDensity, value);
      }

      const image = ctx.createImageData(pixelWidth, pixelHeight);
      const stops = [
        { at: 0, color: [45, 30, 150] },
        { at: 0.32, color: [50, 105, 225] },
        { at: 0.58, color: [255, 230, 60] },
        { at: 0.8, color: [255, 115, 25] },
        { at: 1, color: [220, 20, 35] },
      ];
      const colorMap = new Uint8Array(256 * 3);

      for (let colorIndex = 0; colorIndex < 256; colorIndex += 1) {
        const intensity = colorIndex / 255;
        let lower = stops[0];
        let upper = stops[stops.length - 1];
        for (let stopIndex = 1; stopIndex < stops.length; stopIndex += 1) {
          if (intensity <= stops[stopIndex].at) {
            lower = stops[stopIndex - 1];
            upper = stops[stopIndex];
            break;
          }
        }
        const blend = (intensity - lower.at) / (upper.at - lower.at);
        const colorOffset = colorIndex * 3;
        colorMap[colorOffset] = Math.round(
          lower.color[0] + (upper.color[0] - lower.color[0]) * blend
        );
        colorMap[colorOffset + 1] = Math.round(
          lower.color[1] + (upper.color[1] - lower.color[1]) * blend
        );
        colorMap[colorOffset + 2] = Math.round(
          lower.color[2] + (upper.color[2] - lower.color[2]) * blend
        );
      }

      for (let index = 0; index < density.length; index += 1) {
        const value = density[index];
        if (value === 0) continue;

        const intensity = Math.pow(value / maxDensity, 0.65);
        if (intensity < 0.04) continue;
        const colorOffset = Math.min(255, Math.round(intensity * 255)) * 3;
        const pixelIndex = index * 4;

        image.data[pixelIndex] = colorMap[colorOffset];
        image.data[pixelIndex + 1] = colorMap[colorOffset + 1];
        image.data[pixelIndex + 2] = colorMap[colorOffset + 2];
        image.data[pixelIndex + 3] = Math.round(
          (0.2 + intensity * 0.8) * opacity * 255
        );
      }

      ctx.putImageData(image, 0, 0);
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(wrapper);
    window.addEventListener("resize", draw);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [samples, opacity, radius]);

  return (
    <canvas
      ref={canvasRef}
      className="gaze-heatmap"
      aria-label="Estimated gaze concentration heatmap"
      role="img"
    />
  );
}
