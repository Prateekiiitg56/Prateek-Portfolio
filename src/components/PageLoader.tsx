import "./styles/PageLoader.css";

/** Fallback shown while a lazily loaded page downloads. */
const PageLoader = () => (
  <div className="page-loader" role="status">
    <span className="page-loader-ring" aria-hidden="true" />
    <span className="page-loader-text">Loading page</span>
  </div>
);

export default PageLoader;
