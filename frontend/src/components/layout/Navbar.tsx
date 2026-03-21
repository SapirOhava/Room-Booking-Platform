import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/rooms" className="text-lg font-semibold">
          Room Booking App
        </Link>

        <nav className="flex gap-4">
          <Link to="/rooms" className="hover:underline">
            Rooms
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link to="/register" className="hover:underline">
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
