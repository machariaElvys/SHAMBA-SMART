import { Link } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <h2>Shamba-Smart</h2>
      </Link>

      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/crops">Crops</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/learn">Learn</Link></li>
        <li><Link to="/library">Library</Link></li>
        <li><Link to="/about">About</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;