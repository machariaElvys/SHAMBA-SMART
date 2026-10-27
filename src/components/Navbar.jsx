import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={closeMenu} aria-label="Shamba-Smart home">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span className="brand-copy"><strong>shamba</strong><small>SMART FARM JOURNAL</small></span>
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
