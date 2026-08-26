import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
  getDarkModePref,
  getExpenses,
  setDarkModePref,
  updateExpense,
} from "../../storage/expenseStorage";
import { Expense } from "../../types/expense";

export default function HomeScreen() {
  const systemScheme = useColorScheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const CATEGORIES = [
    "Food",
    "Transport",
    "Bills",
    "Shopping",
    "Health",
    "Entertainment",
    "Others",
  ];
  const [category, setCategory] = useState("");

  const [darkMode, setDarkMode] = useState(systemScheme === "dark");

  useFocusEffect(
    useCallback(() => {
      getDarkModePref().then((saved) => {
        if (saved !== null) setDarkMode(saved);
      });
    }, []),
  );

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

  function resetForm() {
    setAmount("");
    setCategory("");
    setNote("");
    setEditingId(null);
    setFormOpen(false);
  }

  function openForEdit(expense: Expense) {
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setNote(expense.note ?? "");
    setEditingId(expense.id);
    setFormOpen(true);
  }

  async function handleSave() {
    const parsedAmount = parseFloat(amount);

    if (!amount) {
      Alert.alert("Missing info", "Please enter an amount and category.");
      return;
    }
    if (!amount || !category) {
      Alert.alert(
        "Missing info",
        "Please enter an amount and select a category.",
      );
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Amount must be a number greater than zero.",
      );
      return;
    }

    if (editingId) {
      await updateExpense({
        id: editingId,
        amount: parsedAmount,
        category: category,
        date:
          expenses.find((e) => e.id === editingId)?.date ??
          new Date().toISOString().split("T")[0],
        note: note.trim() || undefined,
      });
    } else {
      await addExpense({
        amount: parsedAmount,
        category: category,
        date: new Date().toISOString().split("T")[0],
        note: note.trim() || undefined,
      });
    }

    resetForm();
    loadExpenses();
  }

  function handleDelete(id: string) {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteExpense(id);
            if (editingId === id) resetForm();
            loadExpenses();
          },
        },
      ],
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      e.category.toLowerCase().includes(query) ||
      (e.note?.toLowerCase().includes(query) ?? false)
    );
  });

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
          onPress={() => {
            const newValue = !darkMode;
            setDarkMode(newValue);
            setDarkModePref(newValue);
          }}
          style={styles.themeToggle}
        >
          <Text style={{ fontSize: 20 }}>{darkMode ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Add/Edit Form */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.accent }]}
        onPress={() => (formOpen ? resetForm() : setFormOpen(true))}
      >
        <Text style={styles.addButtonText}>
          {formOpen ? "✕ Close" : "+ Add Expense"}
        </Text>
      </TouchableOpacity>

      {formOpen && (
        <View style={[styles.form, { backgroundColor: theme.card }]}>
          {editingId && (
            <Text style={[styles.editingLabel, { color: theme.accent }]}>
              Editing expense
            </Text>
          )}
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

          <TouchableOpacity
            style={[
              styles.input,
              { borderColor: theme.border, justifyContent: "center" },
            ]}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text
              style={{
                color: category ? theme.text : theme.subtext,
                fontSize: 15,
              }}
            >
              {category || "Select category"}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={categoryModalVisible}
            animationType="fade"
            transparent
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCategoryModalVisible(false)}
            >
              <View
                style={[
                  styles.categoryModalContent,
                  { backgroundColor: theme.card },
                ]}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      { borderColor: theme.border },
                      cat === category && {
                        backgroundColor: theme.accent + "20",
                      },
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text
                      style={{
                        color: cat === category ? theme.accent : theme.text,
                        fontWeight: cat === category ? "600" : "400",
                        fontSize: 16,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
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
            <Text style={styles.addButtonText}>
              {editingId ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[
          styles.searchInput,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by category or note"
        placeholderTextColor={theme.subtext}
      />

      {/* Expense List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.subtext }]}>
            No expenses yet.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bubble, { backgroundColor: theme.card }]}
            onPress={() => openForEdit(item)}
            activeOpacity={0.7}
          >
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
          </TouchableOpacity>
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
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  editingLabel: { fontWeight: "600", fontSize: 13, marginBottom: 2 },
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

  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryModalContent: {
    width: "80%",
    borderRadius: 16,
    paddingVertical: 8,
  },
  categoryOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
});
