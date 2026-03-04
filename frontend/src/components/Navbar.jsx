import { useNavigate } from "react-router-dom";
import { IndianRupee } from "lucide-react";

export default function Navbar({ profileName }) {
  const navigate = useNavigate();

  const handleLogout = () => {
  const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key.includes("_level_") ||
        key.includes("_unlocked") ||
        key.includes("_next_difficulty")
      ) {
        keysToRemove.push(key);
      }
    }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    navigate("/");
  };

  return (
    <div className="bg-pink-500 text-white px-6 py-4 flex justify-between items-center shadow-md">
      
      {/* Logo */}
      <div 
        onClick={() => navigate("/home")}
        className="flex items-center gap-2 text-xl font-bold cursor-pointer"
      >
        <IndianRupee />
        Coincious
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Profile Button */}
        <div
          onClick={() => navigate("/profile")}
          className="bg-pink-400 px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-pink-300 transition"
        >
          👤 {profileName}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm hover:opacity-80"
        >
          ⎋ Logout
        </button>
      </div>
    </div>
  );
}