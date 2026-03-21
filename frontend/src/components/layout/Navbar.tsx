import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, removeToken } from "../../utils/token";

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  function handleLogout() {
    removeToken();
    navigate("/login");
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/rooms" className="text-lg font-semibold">
          Room Booking App
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/rooms" className="hover:underline">
            Rooms
          </Link>

          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link to="/register" className="hover:underline">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
