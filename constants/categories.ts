export const CATEGORY_META: Record<
  string,
  { icon: string; cardColor: string; chartColor: string }
> = {
  Food: { icon: "🍔", cardColor: "#FF6B6B", chartColor: "#FF6B6B" },
  Groceries: { icon: "🛒", cardColor: "#51CF66", chartColor: "#51CF66" },
  Transport: { icon: "🚗", cardColor: "#4DABF7", chartColor: "#4DABF7" },
  Bills: { icon: "🧾", cardColor: "#FFB84D", chartColor: "#FFB84D" },
  Shopping: { icon: "🛍️", cardColor: "#B197FC", chartColor: "#B197FC" },
  Health: { icon: "💊", cardColor: "#38D9A9", chartColor: "#38D9A9" },
  Entertainment: { icon: "🎬", cardColor: "#F783AC", chartColor: "#F783AC" },
  Education: { icon: "📚", cardColor: "#3BC9DB", chartColor: "#3BC9DB" },
  Travel: { icon: "✈️", cardColor: "#9775FA", chartColor: "#9775FA" },
  "Personal Care": { icon: "🧴", cardColor: "#FFA94D", chartColor: "#FFA94D" },
  Gifts: { icon: "🎁", cardColor: "#E64980", chartColor: "#E64980" },
  Savings: { icon: "💰", cardColor: "#2F9E44", chartColor: "#2F9E44" },
  Others: { icon: "📦", cardColor: "#868E96", chartColor: "#868E96" },
};

export const CATEGORIES = Object.keys(CATEGORY_META);
