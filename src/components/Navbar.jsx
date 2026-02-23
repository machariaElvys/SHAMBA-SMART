import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

function Navbar({ isLoggedIn = false, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);

  const handleLogoutClick = () => {
    closeMenu();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={closeMenu}>
        <h2>Shamba-Smart</h2>
      </Link>

      <button
        type="button"
        className="nav-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>

      <div className={`nav-links ${open ? "open" : ""}`}>
        <ul>
          <li>
            <NavLink to="/" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Home
            </NavLink>
          </li>

          <li>
            <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink to="/crops" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Crops
            </NavLink>
          </li>

          <li>
            <NavLink to="/learn" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Learn
            </NavLink>
          </li>

          <li>
            <NavLink to="/library" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Crop Library
            </NavLink>
          </li>

          <li>
            <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              About
            </NavLink>
          </li>

          {!isLoggedIn ? (
            <>
              <li>
                <NavLink to="/login" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
                  Register
                </NavLink>
              </li>
            </>
          ) : (
            <li>
              <button type="button" className="logout-btn" onClick={handleLogoutClick}>
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>

      {open && (
        <button
          type="button"
          className="nav-overlay"
          onClick={closeMenu}
          aria-label="Close menu"
        />
      )}
    </nav>
  );
}

export default Navbar;