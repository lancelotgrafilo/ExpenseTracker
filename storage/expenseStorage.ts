import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense } from "../types/expense";

const STORAGE_KEY = "@expenses";
const THEME_KEY = "@darkMode";

// Get all expenses
export async function getExpenses(): Promise<Expense[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Failed to load expenses:", error);
    return [];
  }
}

// Add a new expense
export async function addExpense(expense: Omit<Expense, "id">): Promise<void> {
  try {
    const expenses = await getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(), // simple unique id
    };
    const updated = [...expenses, newExpense];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to add expense:", error);
  }
}

// Delete an expense by id
export async function deleteExpense(id: string): Promise<void> {
  try {
    const expenses = await getExpenses();
    const updated = expenses.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to delete expense:", error);
  }
}

// Update an existing expense
export async function updateExpense(updatedExpense: Expense): Promise<void> {
  try {
    const expenses = await getExpenses();
    const updated = expenses.map((e) =>
      e.id === updatedExpense.id ? updatedExpense : e,
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update expense:", error);
  }
}

export async function getDarkModePref(): Promise<boolean | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    return value !== null ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Failed to load theme preference:", error);
    return null;
  }
}

export async function setDarkModePref(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save theme preference:", error);
  }
}

export function expensesToCSV(expenses: Expense[]): string {
  const header = "Date,Category,Amount,Note";
  const rows = expenses.map((e) =>
    [e.date, e.category, e.amount, e.note ?? ""].map((v) => `"${v}"`).join(","),
  );
  return [header, ...rows].join("\n");
}
