import { useNavigate } from "react-router-dom";
import { IndianRupee } from "lucide-react";

export default function Navbar({ profileName }) {
  const navigate = useNavigate();

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
        <div className="bg-pink-400 px-4 py-2 rounded-full text-sm">
          👤 {profileName}
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm hover:opacity-80"
        >
          ⎋ Logout
        </button>
      </div>
    </div>
  );
}