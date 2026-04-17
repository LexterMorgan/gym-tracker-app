import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { StartWorkoutPage } from "./pages/StartWorkoutPage";
import { WorkoutLoggerPage } from "./pages/WorkoutLoggerPage";
import { ProgressPage } from "./pages/ProgressPage";
import { PlannerPage } from "./pages/PlannerPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/start" element={<StartWorkoutPage />} />
            <Route path="/workout" element={<WorkoutLoggerPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/history" element={<ProgressPage />} />
            <Route path="/planner" element={<PlannerPage />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
