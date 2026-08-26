import * as FileSystem from "expo-file-system";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { expensesToCSV, getExpenses } from "../../storage/expenseStorage";
import { Expense } from "../../types/expense";
type Period = "daily" | "weekly" | "monthly";

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  Food: { icon: "🍔", color: "#FFE3E3" },
  Transport: { icon: "🚗", color: "#E3F0FF" },
  Bills: { icon: "🧾", color: "#FFF3D6" },
  Shopping: { icon: "🛍️", color: "#F3E3FF" },
  Health: { icon: "💊", color: "#E3FFF0" },
  Entertainment: { icon: "🎬", color: "#FFE3F5" },
  Others: { icon: "📦", color: "#EAEAEA" },
};

const CHART_COLORS = [
  "#007aff",
  "#34c759",
  "#ff9500",
  "#ff2d55",
  "#af52de",
  "#5ac8fa",
  "#ffcc00",
];

export default function ReportsScreen() {
  const systemScheme = useColorScheme();
  const darkMode = systemScheme === "dark";
  const theme = darkMode ? darkColors : lightColors;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<Period>("daily");

  useFocusEffect(
    useCallback(() => {
      getExpenses().then(setExpenses);
    }, []),
  );

  function isInPeriod(dateStr: string, period: Period): boolean {
    const date = new Date(dateStr);
    const now = new Date();

    if (period === "daily") {
      return dateStr === now.toISOString().split("T")[0];
    }
    if (period === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    }
    // monthly
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  const filtered = expenses.filter((e) => isInPeriod(e.date, period));
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const chartData = Object.entries(categoryTotals).map(
    ([category, amount], i) => ({
      name: category,
      amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
      legendFontColor: theme.text,
      legendFontSize: 13,
    }),
  );

  const screenWidth = Dimensions.get("window").width;

  async function handleExport() {
    if (expenses.length === 0) {
      Alert.alert("No data", "There are no expenses to export yet.");
      return;
    }

    const csv = expensesToCSV(expenses);

    try {
      const file = new FileSystem.File(
        FileSystem.Paths.document,
        "expenses.csv",
      );
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Expenses",
      });
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Export failed", "Something went wrong while exporting.");
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Reports</Text>

      {/* Segmented control */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.card }]}>
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.segmentButton,
              period === p && { backgroundColor: theme.accent },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: period === p ? "#fff" : theme.text },
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.exportButton,
          { backgroundColor: theme.card, borderColor: theme.accent },
        ]}
        onPress={handleExport}
      >
        <Text style={[styles.exportButtonText, { color: theme.accent }]}>
          ⬆ Export as CSV
        </Text>
      </TouchableOpacity>

      {/* Total */}
      <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.totalLabel, { color: theme.subtext }]}>
          Total Spent
        </Text>
        <Text style={[styles.totalAmount, { color: theme.text }]}>
          ₱{total.toFixed(2)}
        </Text>
      </View>

      {/* Donut chart */}
      {chartData.length > 0 ? (
        <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
          <PieChart
            data={chartData}
            width={screenWidth - 32}
            height={200}
            chartConfig={{
              color: () => theme.text,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            hasLegend={true}
          />
        </View>
      ) : (
        <Text style={[styles.empty, { color: theme.subtext }]}>
          No expenses for this period.
        </Text>
      )}
      {Object.keys(categoryTotals).length > 0 && (
        <View style={styles.cardGrid}>
          {Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => {
              const meta = CATEGORY_META[cat] ?? {
                icon: "💰",
                color: "#EEEEEE",
              };
              return (
                <View
                  key={cat}
                  style={[styles.categoryCard, { backgroundColor: meta.color }]}
                >
                  <Text style={styles.categoryIcon}>{meta.icon}</Text>
                  <Text style={styles.categoryCardLabel}>{cat}</Text>
                  <Text style={styles.categoryCardAmount}>
                    ₱{amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </ScrollView>
  );
}

const lightColors = {
  background: "#f5f5f7",
  card: "#ffffff",
  text: "#1c1c1e",
  subtext: "#8e8e93",
  accent: "#007aff",
};

const darkColors = {
  background: "#000000",
  card: "#1c1c1e",
  text: "#ffffff",
  subtext: "#98989f",
  accent: "#0a84ff",
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentText: { fontWeight: "600", fontSize: 14 },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, marginBottom: 4 },
  totalAmount: { fontSize: 32, fontWeight: "700" },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
    alignItems: "center",
  },
  exportButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  exportButtonText: { fontWeight: "600", fontSize: 14 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15 },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  categoryIcon: { fontSize: 24, marginBottom: 6 },
  categoryCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 2,
  },
  categoryCardAmount: { fontSize: 18, fontWeight: "700", color: "#1c1c1e" },
});
