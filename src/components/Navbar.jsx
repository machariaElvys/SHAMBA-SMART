import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/navbar.css";

function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

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

          {user ? (
            <>
              <li>
                <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
              </li>
              <li>
                <NavLink to="/crops" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>Crops</NavLink>
              </li>
              <li>
                <NavLink to="/library" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>Crop Library</NavLink>
              </li>
            </>
          ) : null}

          <li>
            <NavLink to="/learn" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Learn
            </NavLink>
          </li>

          <li>
            <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}> 
              About
            </NavLink>
          </li>

          {user ? (
            <li className="nav-account">
              <span className="nav-user">{user.email}</span>
              <button className="nav-logout" type="button" onClick={() => { closeMenu(); onLogout(); }}>Sign out</button>
            </li>
          ) : (
            <>
              <li>
                <NavLink to="/login" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>Sign in</NavLink>
              </li>
              <li>
                <NavLink to="/register" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>Create account</NavLink>
              </li>
            </>
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
