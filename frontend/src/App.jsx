import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Currency from "./pages/Currency";
import Math from "./pages/Math";
import AdditionPage from "./pages/AdditionPage";
import Profile from "./pages/Profile";
import Study from "./pages/Study";
import Identification from "./pages/Identification";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/currency" element={<Currency />} />
        <Route path="/math" element={<Math />} />
        <Route path="/addition" element={<AdditionPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/study" element={<Study />} />
        <Route path="/identification" element={<Identification />} />
      </Routes>
    </Router>
  );
}