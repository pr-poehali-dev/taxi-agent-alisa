export const API_AUTH = "https://functions.poehali.dev/cf9bec69-4653-4e8c-9fd4-b338d3b16813";
export const API_ORDERS = "https://functions.poehali.dev/69406187-ed0b-4d03-9d39-436ddd735c01";
export const API_CHAT = "https://functions.poehali.dev/31593179-9aa7-4ad9-b130-e9275e53f535";
export const API_REVIEWS = "https://functions.poehali.dev/287adda7-337c-4c11-8150-0de8515518bf";

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("taxi_token");
  return token
    ? { "X-Auth-Token": token, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export interface TaxiUser {
  id: number;
  login: string;
  role: "dispatcher" | "driver";
  full_name: string;
  phone?: string;
  is_active?: boolean;
}

export interface TaxiOrder {
  id: number;
  passenger_name: string;
  passenger_phone: string;
  from_city: string;
  to_city: string;
  trip_date: string;
  passengers_count: number;
  comment: string;
  status: "new" | "assigned" | "in_progress" | "done" | "cancelled";
  driver_id: number | null;
  dispatcher_id: number | null;
  price: number | null;
  chat_token: string;
  created_at: string;
  updated_at: string;
  driver?: { full_name: string; phone: string } | null;
}

export interface ChatMessage {
  id: number;
  sender_role: "passenger" | "dispatcher" | "driver";
  sender_name: string;
  text: string;
  created_at: string;
}

export const STATUS_LABELS: Record<TaxiOrder["status"], string> = {
  new: "Новый",
  assigned: "Назначен",
  in_progress: "В пути",
  done: "Завершён",
  cancelled: "Отменён",
};

export const STATUS_COLORS: Record<TaxiOrder["status"], string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  assigned: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  done: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};
