import { generateReport } from "../features/battle-report.js?v=0.2.6";

const TYPE_META = [
  { emoji: "🪨", label: "石头", color: "#6B7280" },
  { emoji: "✂️", label: "剪刀", color: "#EF4444" },
  { emoji: "✋🏻", label: "布", color: "#3B82F6" },
];

export function createReportPanel({ ui }) {
  let currentReport = null;

  function showReport(log) {
    currentReport = generateReport(log);
    renderText(currentReport.text);
    renderMvp(currentReport.mvp);
    showElement(ui.reportScreen, "grid");
    if (ui.reportChart) {
      requestAnimationFrame(() => drawChart(currentReport.chartData));
    }
  }

  function hideReport() {
    hideElement(ui.reportScreen);
  }

  function renderText(sentences) {
    ui.reportText.replaceChildren(...sentences.map((sentence) => {
      const item = document.createElement("p");
      item.textContent = sentence;
      return item;
    }));
  }

  function renderMvp(mvp) {
    const rows = [];
    if (mvp.conversionKing) {
      rows.push(`转化王：${TYPE_META[mvp.conversionKing.type]?.emoji || ""} #${mvp.conversionKing.id}，转化/击杀 ${mvp.conversionKing.count} 次。`);
    } else {
      rows.push("转化王：本局没有有效转化。");
    }
    if (mvp.survivor.total > 0) {
      const type = TYPE_META[mvp.survivor.type];
      rows.push(`全程未被转化：${mvp.survivor.total} 个，最多来自 ${type?.emoji || ""}${type?.label || ""}。`);
    } else {
      rows.push("无人全程幸存。");
    }
    if (mvp.comeback) {
      const type = TYPE_META[mvp.comeback.type];
      rows.push(`最大逆转：${type.emoji} 从 ${mvp.comeback.min} 人绝地翻盘。`);
    }
    ui.reportMvp.replaceChildren(...rows.map((text) => {
      const item = document.createElement("div");
      item.className = "report-mvp-row";
      item.textContent = text;
      return item;
    }));
  }

  function drawChart(chartData) {
    const canvas = ui.reportChart;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const points = chartData.points;
    if (!points.length) return;
    const pad = { left: 36, right: 14, top: 18, bottom: 28 };
    const width = rect.width - pad.left - pad.right;
    const height = rect.height - pad.top - pad.bottom;
    const maxT = Math.max(1, ...points.map((point) => point.t));
    const maxCount = Math.max(1, ...points.flatMap((point) => point.counts));

    drawGrid(ctx, rect, pad, width, height, maxT, maxCount);
    for (const line of chartData.lines) {
      drawLine(ctx, points, line, pad, width, height, maxT, maxCount);
    }
    drawMarkers(ctx, chartData.markers, pad, width, height, maxT);
    drawLegend(ctx, chartData.lines, rect.width);
  }

  function drawGrid(ctx, rect, pad, width, height, maxT, maxCount) {
    ctx.save();
    ctx.strokeStyle = "rgba(23,32,28,0.12)";
    ctx.fillStyle = "rgba(23,32,28,0.48)";
    ctx.lineWidth = 1;
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.top + height * (i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(rect.width - pad.right, y);
      ctx.stroke();
      const value = Math.round(maxCount * (1 - i / 4));
      ctx.fillText(String(value), 6, y + 4);
    }
    ctx.fillText("0s", pad.left, rect.height - 8);
    ctx.fillText(`${maxT.toFixed(0)}s`, pad.left + width - 26, rect.height - 8);
    ctx.restore();
  }

  function drawLine(ctx, points, line, pad, width, height, maxT, maxCount) {
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = pad.left + (point.t / maxT) * width;
      const y = pad.top + height - (point.counts[line.type] / maxCount) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function drawMarkers(ctx, markers, pad, width, height, maxT) {
    ctx.save();
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textBaseline = "top";
    for (const marker of markers.slice(0, 12)) {
      const x = pad.left + (marker.t / maxT) * width;
      ctx.strokeStyle = "rgba(23,32,28,0.2)";
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + height);
      ctx.stroke();
      ctx.fillStyle = "rgba(23,32,28,0.72)";
      ctx.fillText(marker.label, Math.min(x + 3, pad.left + width - 56), pad.top + 4);
    }
    ctx.restore();
  }

  function drawLegend(ctx, lines, width) {
    ctx.save();
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    let x = Math.max(42, width - 185);
    for (const line of lines) {
      ctx.fillStyle = line.color;
      ctx.fillText(`${line.emoji} ${line.label}`, x, 16);
      x += 60;
    }
    ctx.restore();
  }

  ui.reportClose?.addEventListener("click", hideReport);
  window.addEventListener("resize", () => {
    if (!ui.reportScreen.classList.contains("hidden") && currentReport) {
      drawChart(currentReport.chartData);
    }
  });

  return {
    showReport,
    hideReport,
  };
}

function showElement(element, display = "block") {
  element.hidden = false;
  element.classList.remove("hidden");
  element.style.display = display;
}

function hideElement(element) {
  element.classList.add("hidden");
  element.hidden = true;
  element.style.removeProperty("display");
}
