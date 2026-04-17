import { Navigate } from "react-router-dom";
import { authApi } from "@/lib/api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!authApi.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;