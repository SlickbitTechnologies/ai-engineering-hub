import { useAuth } from "../../contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import Icon from "../ui/Icon";
import { theme } from "../../styles/theme";

export default function UserProfile() {
  const { currentUser, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      {currentUser.photoURL ? (
        <img
          src={currentUser.photoURL}
          alt="Profile"
          className="w-8 h-8 rounded-full border-2"
          style={{ borderColor: theme.colors.primary[200] }}
        />
      ) : (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: theme.colors.primary[100],
          }}
        >
          <Icon icon={User} size="xs" variant="primary" />
        </div>
      )}
      <div className="text-sm">
        <div 
          className="font-medium"
          style={{ color: theme.colors.neutral[800] }}
        >
          {currentUser.displayName || currentUser.email}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center text-xs hover:underline mt-1"
          style={{ color: theme.colors.neutral[500] }}
        >
          <Icon icon={LogOut} size="xs" variant="neutral" strokeWidth={2} />
          <span className="ml-1">Sign out</span>
        </button>
      </div>
    </div>
  );
} 