import { Link, useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { isAuthenticated, removeToken } from "../../utils/token";

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  function handleLogout() {
    removeToken();
    navigate("/login");
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/rooms" className="text-lg font-semibold tracking-tight">
          Room Booking App
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/rooms">Rooms</Link>
          </Button>

          {loggedIn ? (
            <Button type="button" variant="default" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>

              <Button asChild variant="default">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
