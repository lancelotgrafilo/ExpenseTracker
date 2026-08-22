import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  addExpense,
  deleteExpense,
  getExpenses,
} from "../../storage/expenseStorage";
import { Expense } from "../../types/expense";

export default function HomeScreen() {
  const systemScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemScheme === "dark");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const theme = darkMode ? darkColors : lightColors;

  const loadExpenses = useCallback(async () => {
    const data = await getExpenses();
    setExpenses(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  async function handleSave() {
    if (!amount || !category) {
      Alert.alert("Missing info", "Please enter an amount and category.");
      return;
    }
    await addExpense({
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().split("T")[0],
      note: note || undefined,
    });
    setAmount("");
    setCategory("");
    setNote("");
    setFormOpen(false);
    loadExpenses();
  }

  async function handleDelete(id: string) {
    await deleteExpense(id);
    loadExpenses();
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Expenses</Text>
          <Text style={[styles.total, { color: theme.subtext }]}>
            Total: ₱{total.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setDarkMode(!darkMode)}
          style={styles.themeToggle}
        >
          <Text style={{ fontSize: 20 }}>{darkMode ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Add Form */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.accent }]}
        onPress={() => setFormOpen(!formOpen)}
      >
        <Text style={styles.addButtonText}>
          {formOpen ? "✕ Close" : "+ Add Expense"}
        </Text>
      </TouchableOpacity>

      {formOpen && (
        <View style={[styles.form, { backgroundColor: theme.card }]}>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            placeholderTextColor={theme.subtext}
          />
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            value={category}
            onChangeText={setCategory}
            placeholder="Category (e.g. Food)"
            placeholderTextColor={theme.subtext}
          />
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            placeholderTextColor={theme.subtext}
          />
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={handleSave}
          >
            <Text style={styles.addButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expense List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.subtext }]}>
            No expenses yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, { backgroundColor: theme.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bubbleCategory, { color: theme.text }]}>
                {item.category}
              </Text>
              {item.note ? (
                <Text style={[styles.bubbleNote, { color: theme.subtext }]}>
                  {item.note}
                </Text>
              ) : null}
              <Text style={[styles.bubbleDate, { color: theme.subtext }]}>
                {item.date}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.bubbleAmount, { color: theme.text }]}>
                ₱{item.amount.toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={{ color: "#ff5252", marginTop: 4 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const lightColors = {
  background: "#f5f5f7",
  card: "#ffffff",
  text: "#1c1c1e",
  subtext: "#8e8e93",
  border: "#e0e0e0",
  accent: "#007aff",
};

const darkColors = {
  background: "#000000",
  card: "#1c1c1e",
  text: "#ffffff",
  subtext: "#98989f",
  border: "#3a3a3c",
  accent: "#0a84ff",
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700" },
  total: { fontSize: 15, marginTop: 2 },
  themeToggle: { padding: 8 },
  addButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  form: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
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
  bubbleDate: { fontSize: 12, marginTop: 4 },
  bubbleAmount: { fontSize: 16, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15 },
});
