import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Currency from "./pages/Currency";
import MathPage from "./pages/MathPage";
import AdditionPage from "./pages/AdditionPage";
import Subtraction from "./pages/Subtraction";
import Multiplication from "./pages/Multiplication";
import Division from "./pages/Division";
import WordProblems from "./pages/WordProblem";
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
        <Route path="/math" element={<MathPage />} />
        <Route path="/addition" element={<AdditionPage />} />
        <Route path="/subtraction" element={<Subtraction />} />
        <Route path="/multiplication" element={<Multiplication />} />
        <Route path="/division" element={<Division />} />
        <Route path="/wordproblems" element={<WordProblems />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/study" element={<Study />} />
        <Route path="/identification" element={<Identification />} />

      </Routes>
    </Router>
  );
}