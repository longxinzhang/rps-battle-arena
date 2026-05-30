export const THEMES = {
  rps: {
    mark: "🪨✂️✋🏻",
    subtitle: "石头剪刀布 · 物理碰撞吞并战",
    types: [
      { key: "rock", label: "石头", emoji: "🪨", color: "#d95c47", tone: 196 },
      { key: "scissors", label: "剪刀", emoji: "✂️", color: "#2c8f7f", tone: 277 },
      { key: "paper", label: "布", emoji: "✋🏻", color: "#4e6edb", tone: 330 },
    ],
  },
  colors: {
    mark: "🔴🟢🔵",
    subtitle: "颜色球联赛 · 红绿蓝循环吞并",
    types: [
      { key: "red", label: "红球", emoji: "🔴", color: "#e84f4f", tone: 196 },
      { key: "green", label: "绿球", emoji: "🟢", color: "#22a65a", tone: 277 },
      { key: "blue", label: "蓝球", emoji: "🔵", color: "#3478f6", tone: 330 },
    ],
  },
  countries: {
    mark: "🇨🇳🇺🇸🇧🇷",
    subtitle: "国家队表演赛 · 阵营身份换皮",
    types: [
      { key: "china", label: "中国队", emoji: "🇨🇳", color: "#de3f32", tone: 196 },
      { key: "usa", label: "美国队", emoji: "🇺🇸", color: "#2456c6", tone: 277 },
      { key: "brazil", label: "巴西队", emoji: "🇧🇷", color: "#18a55f", tone: 330 },
    ],
  },
  brands: {
    mark: "◆✦⬢",
    subtitle: "虚构品牌战 · 三家公司抢占场面",
    types: [
      { key: "nova", label: "Nova", emoji: "◆", color: "#e0574f", tone: 196 },
      { key: "pulse", label: "Pulse", emoji: "✦", color: "#15a38b", tone: 277 },
      { key: "orbit", label: "Orbit", emoji: "⬢", color: "#5867db", tone: 330 },
    ],
  },
};

export function createTypeInfo() {
  return THEMES.rps.types.map((item) => ({ ...item }));
}
