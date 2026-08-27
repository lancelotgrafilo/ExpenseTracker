import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import {
  addExpense,
  deleteExpense,
  getDailyBudget,
  getDarkModePref,
  getExpenses,
  setDailyBudget,
  setDarkModePref,
  updateExpense,
} from "../../storage/expenseStorage";

import { CATEGORIES } from "../../constants/categories";

import { Expense } from "../../types/expense";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function PressableScale({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scale = new Animated.Value(1);

  function onPressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }
  function onPressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const systemScheme = useColorScheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [category, setCategory] = useState("");

  const [darkMode, setDarkMode] = useState(systemScheme === "dark");

  const [dailyBudget, setDailyBudgetState] = useState<number | null>(null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const loadExpenses = useCallback(async () => {
    const data = await getExpenses();
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, "easeInEaseOut", "opacity"),
    );
    setExpenses(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      getDarkModePref().then((saved) => {
        if (saved !== null) setDarkMode(saved);
      });
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      getDailyBudget().then((saved) => {
        if (saved !== null) setDailyBudgetState(saved);
      });
    }, []),
  );

  const theme = darkMode ? darkColors : lightColors;

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

  const today = new Date().toISOString().split("T")[0];
  const todayExpenses = expenses.filter((e) => e.date === today);

  const filteredExpenses = todayExpenses.filter((e) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      e.category.toLowerCase().includes(query) ||
      (e.note?.toLowerCase().includes(query) ?? false)
    );
  });

  const total = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRemaining = dailyBudget !== null ? dailyBudget - total : null;
  const budgetProgress = dailyBudget ? Math.min(total / dailyBudget, 1) : 0;
  const overBudget = budgetRemaining !== null && budgetRemaining < 0;

  async function handleSaveBudget() {
    const parsed = parseFloat(budgetInput);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid amount", "Please enter a budget greater than zero.");
      return;
    }
    await setDailyBudget(parsed);
    setDailyBudgetState(parsed);
    setBudgetModalVisible(false);
    setBudgetInput("");
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Today</Text>
          <Text style={[styles.total, { color: theme.subtext }]}>
            Spent: ₱{total.toFixed(2)}
          </Text>
        </View>
        <PressableScale
          onPress={() => {
            const newValue = !darkMode;
            setDarkMode(newValue);
            setDarkModePref(newValue);
            DeviceEventEmitter.emit("darkModeChanged", newValue);
          }}
          style={styles.themeToggle}
        >
          <Text style={{ fontSize: 20 }}>{darkMode ? "☀️" : "🌙"}</Text>
        </PressableScale>
      </View>

      <PressableScale
        style={[styles.budgetCard, { backgroundColor: theme.card }]}
        onPress={() => {
          setBudgetInput(dailyBudget?.toString() ?? "");
          setBudgetModalVisible(true);
        }}
      >
        {dailyBudget === null ? (
          <Text style={[styles.budgetSetText, { color: theme.accent }]}>
            + Set daily budget
          </Text>
        ) : (
          <>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: theme.subtext }]}>
                Daily Budget
              </Text>
              <Text
                style={[
                  styles.budgetRemaining,
                  { color: overBudget ? "#ff5252" : theme.text },
                ]}
              >
                {overBudget
                  ? `₱${Math.abs(budgetRemaining!).toFixed(2)} over`
                  : `₱${budgetRemaining!.toFixed(2)} left`}
              </Text>
            </View>
            <View
              style={[styles.progressTrack, { backgroundColor: theme.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${budgetProgress * 100}%`,
                    backgroundColor: overBudget ? "#ff5252" : theme.accent,
                  },
                ]}
              />
            </View>
          </>
        )}
      </PressableScale>

      {/* Collapsible Add/Edit Form */}
      <PressableScale
        style={[styles.addButton, { backgroundColor: theme.accent }]}
        onPress={() => (formOpen ? resetForm() : setFormOpen(true))}
      >
        <Text style={styles.addButtonText}>
          {formOpen ? "✕ Close" : "+ Add Expense"}
        </Text>
      </PressableScale>

      <Modal visible={budgetModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBudgetModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.budgetModalContent, { backgroundColor: theme.card }]}
          >
            <Text
              style={[styles.editingLabel, { color: theme.text, fontSize: 16 }]}
            >
              Set Daily Budget
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, marginTop: 10 },
              ]}
              keyboardType="decimal-pad"
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="e.g. 500"
              placeholderTextColor={theme.subtext}
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.accent, marginTop: 10 },
              ]}
              onPress={handleSaveBudget}
            >
              <Text style={styles.addButtonText}>Save Budget</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

          <PressableScale
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
          </PressableScale>

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
          <Swipeable
            renderRightActions={() => (
              <TouchableOpacity
                style={styles.swipeDelete}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.swipeDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
            overshootRight={false}
          >
            <PressableScale
              style={[styles.bubble, { backgroundColor: theme.card }]}
              onPress={() => openForEdit(item)}
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
              <Text style={[styles.bubbleAmount, { color: theme.text }]}>
                ₱{item.amount.toFixed(2)}
              </Text>
            </PressableScale>
          </Swipeable>
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

  budgetCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  budgetSetText: { textAlign: "center", fontWeight: "600", fontSize: 15 },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  budgetLabel: { fontSize: 13, fontWeight: "600" },
  budgetRemaining: { fontSize: 14, fontWeight: "700" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  budgetModalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },

  swipeDelete: {
    backgroundColor: "#ff5252",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 18,
    marginBottom: 10,
  },
  swipeDeleteText: { color: "#fff", fontWeight: "600" },
});
