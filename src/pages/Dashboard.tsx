import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TaxiUser } from "@/lib/api";
import DispatcherDashboard from "@/pages/dispatcher/DispatcherDashboard";
import DriverDashboard from "@/pages/driver/DriverDashboard";

export default function Dashboard() {
  const navigate = useNavigate();

  const raw = localStorage.getItem("taxi_user");
  const user: TaxiUser | null = raw ? (JSON.parse(raw) as TaxiUser) : null;

  useEffect(() => {
    if (!user || !localStorage.getItem("taxi_token")) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  if (user.role === "dispatcher") return <DispatcherDashboard user={user} />;
  if (user.role === "driver") return <DriverDashboard user={user} />;

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">
      Неизвестная роль: {user.role}
    </div>
  );
}
