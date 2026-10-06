import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => (
  <main className="not-found">
    <p className="not-found-code">404</p>
    <h1>This page doesn't exist</h1>
    <p className="not-found-text">The link may be broken, or the page has moved.</p>
    <div className="not-found-actions">
      <Link to="/" className="not-found-btn not-found-btn-primary">
        Back to home
      </Link>
      <Link to="/myworks" className="not-found-btn">
        See all works
      </Link>
    </div>
  </main>
);

export default NotFound;
