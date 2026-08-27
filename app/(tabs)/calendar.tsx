import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { getDarkModePref, getExpenses } from "../../storage/expenseStorage";
import { Expense } from "../../types/expense";

export default function CalendarScreen() {
  const systemScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemScheme === "dark");

  useFocusEffect(
    useCallback(() => {
      getDarkModePref().then((saved) => {
        if (saved !== null) setDarkMode(saved);
      });
    }, []),
  );
  const theme = darkMode ? darkColors : lightColors;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  useFocusEffect(
    useCallback(() => {
      getExpenses().then(setExpenses);
    }, []),
  );

  const dailyTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });

  const selectedDayExpenses = expenses.filter((e) => e.date === selectedDate);
  const selectedDayTotal = selectedDayExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  // Mark all dates that have at least one expense
  const markedDates: Record<string, any> = {};
  expenses.forEach((e) => {
    markedDates[e.date] = { marked: true, dotColor: theme.accent };
  });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: theme.accent,
  };

  function renderDay({ date, state }: { date?: DateData; state?: string }) {
    if (!date) return <View />;
    const dayTotal = dailyTotals[date.dateString];
    const isSelected = date.dateString === selectedDate;
    const isToday = state === "today";

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          isSelected && { backgroundColor: theme.accent, borderRadius: 8 },
        ]}
        onPress={() => setSelectedDate(date.dateString)}
      >
        <Text
          style={{
            color: isSelected ? "#fff" : isToday ? theme.accent : theme.text,
            fontWeight: isToday ? "700" : "400",
            fontSize: 14,
          }}
        >
          {date.day}
        </Text>
        {dayTotal ? (
          <Text
            style={{
              color: isSelected ? "#fff" : theme.accent,
              fontSize: 9,
              fontWeight: "600",
              marginTop: 1,
            }}
          >
            ₱
            {dayTotal >= 1000
              ? `${(dayTotal / 1000).toFixed(1)}k`
              : dayTotal.toFixed(0)}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>

      <View style={[styles.calendarCard, { backgroundColor: theme.card }]}>
        <Calendar
          key={darkMode ? "dark" : "light"}
          dayComponent={renderDay}
          theme={{
            backgroundColor: theme.card,
            calendarBackground: theme.card,
            textSectionTitleColor: theme.subtext,
            monthTextColor: theme.text,
            arrowColor: theme.accent,
            textDisabledColor: theme.subtext + "60",
            todayTextColor: theme.accent,
          }}
        />
      </View>

      <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.totalLabel, { color: theme.subtext }]}>
          {selectedDate}
        </Text>
        <Text style={[styles.totalAmount, { color: theme.text }]}>
          ₱{selectedDayTotal.toFixed(2)}
        </Text>
      </View>

      {selectedDayExpenses.length === 0 ? (
        <Text style={[styles.empty, { color: theme.subtext }]}>
          No expenses this day.
        </Text>
      ) : (
        selectedDayExpenses.map((e) => (
          <View
            key={e.id}
            style={[styles.bubble, { backgroundColor: theme.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.bubbleCategory, { color: theme.text }]}>
                {e.category}
              </Text>
              {e.note ? (
                <Text style={[styles.bubbleNote, { color: theme.subtext }]}>
                  {e.note}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.bubbleAmount, { color: theme.text }]}>
              ₱{e.amount.toFixed(2)}
            </Text>
          </View>
        ))
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
  calendarCard: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, marginBottom: 4 },
  totalAmount: { fontSize: 32, fontWeight: "700" },
  bubble: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleCategory: { fontSize: 16, fontWeight: "600" },
  bubbleNote: { fontSize: 13, marginTop: 2 },
  bubbleAmount: { fontSize: 16, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15 },

  dayCell: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
