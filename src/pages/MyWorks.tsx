import { Link } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { FiGrid, FiList, FiSearch, FiShuffle } from "react-icons/fi";
import { config } from "../config";
import ProjectModal from "../components/ProjectModal";
import "./MyWorks.css";

const MyWorks = () => {
  const [selected, setSelected] = useState<{ project: any; origin: HTMLElement | null } | null>(null);
  const selectedProject = selected?.project ?? null;
  const [featuredProject, setFeaturedProject] = useState<any>(config.projects[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filters = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          config.projects.map((project) => project.category.split(" / ")[0])
        )
      ),
    ],
    []
  );

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return config.projects.filter((project) => {
      const matchesFilter =
        activeFilter === "All" || project.category.startsWith(activeFilter);
      const searchableText = [
        project.title,
        project.category,
        project.description,
        project.technologies,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchableText.includes(query));
    });
  }, [activeFilter, searchQuery]);

  const selectedIndex = selectedProject
    ? config.projects.findIndex((project) => project.id === selectedProject.id)
    : -1;

  /** Thumbnail of a project in the grid — the modal image flies from / back to it. */
  const cardImageFor = (id: number) =>
    document.querySelector<HTMLElement>(`[data-project-id="${id}"] .myworks-card-image`);

  const openProject = useCallback((project: any, origin: HTMLElement | null) => {
    setFeaturedProject(project);
    setSelected({ project, origin });
  }, []);

  const closeProject = useCallback(() => setSelected(null), []);

  const selectAdjacentProject = (direction: -1 | 1) => {
    if (selectedIndex === -1) return;
    const nextIndex =
      (selectedIndex + direction + config.projects.length) %
      config.projects.length;
    const next = config.projects[nextIndex];
    openProject(next, cardImageFor(next.id));
  };

  const chooseRandomProject = () => {
    const pool = filteredProjects.length ? filteredProjects : config.projects;
    const randomProject = pool[Math.floor(Math.random() * pool.length)];
    openProject(randomProject, cardImageFor(randomProject.id));
  };

  return (
    <div className="myworks-page">
      <div className="myworks-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Back to Home
        </Link>
        <h1>
          All <span>Works</span>
        </h1>
        <p>A collection of all my projects and creations</p>
      </div>

      <section className="myworks-lab" aria-label="Project explorer">
        <div className="myworks-toolbar">
          <label className="myworks-search">
            <FiSearch aria-hidden="true" />
            <span className="sr-only">Search projects</span>
            <input
              type="search"
              placeholder="Search projects, tools, or ideas..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className="myworks-toolbar-actions">
            <button
              className="random-project-button"
              type="button"
              onClick={chooseRandomProject}
            >
              <FiShuffle aria-hidden="true" /> Random project
            </button>
            <div className="view-toggle" aria-label="Project view">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <FiGrid aria-hidden="true" />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <FiList aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="myworks-filters" aria-label="Filter projects">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "is-active" : ""}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
          <span className="myworks-result-count">
            {filteredProjects.length} / {config.projects.length} projects
          </span>
        </div>

        <article className="myworks-featured">
          <div className="myworks-featured-copy">
            <span className="myworks-kicker">Currently exploring</span>
            <h2>{featuredProject.title}</h2>
            <p className="myworks-featured-category">{featuredProject.category}</p>
            <p>{featuredProject.description}</p>
            <div className="myworks-featured-actions">
              <button
                type="button"
                className="myworks-primary-action"
                onClick={() =>
                  openProject(featuredProject, document.querySelector<HTMLElement>(".myworks-featured-image"))
                }
              >
                Inspect project
              </button>
              {featuredProject.deploy && (
                <a
                  href={featuredProject.deploy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="myworks-secondary-action"
                >
                  Open live demo
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            className="myworks-featured-image"
            onClick={(e) => openProject(featuredProject, e.currentTarget)}
            aria-label={`Inspect ${featuredProject.title}`}
          >
            <img src={featuredProject.image} alt="" loading="lazy" decoding="async" />
          </button>
        </article>

        <div className={`myworks-grid myworks-grid-${viewMode}`}>
        {filteredProjects.map((project) => {
          const index = config.projects.findIndex((item) => item.id === project.id);
          return (
          <div
            className="myworks-card"
            key={project.id}
            data-cursor="disable"
            data-project-id={project.id}
            onMouseEnter={() => setFeaturedProject(project)}
            onClick={(e) => openProject(project, e.currentTarget.querySelector<HTMLElement>(".myworks-card-image"))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openProject(project, event.currentTarget.querySelector<HTMLElement>(".myworks-card-image"));
              }
            }}
            aria-label={`Open ${project.title}`}
            role="button"
            tabIndex={0}
          >
            <div className="myworks-card-number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="myworks-card-image">
              <img src={project.image} alt={project.title} loading="lazy" decoding="async" />
            </div>
            <div className="myworks-card-info">
              <h3>{project.title}</h3>
              <p className="myworks-card-category">{project.category}</p>
              <p className="myworks-card-description">{project.description}</p>
              <p className="myworks-card-tech">{project.technologies}</p>
            </div>
          </div>
          );
        })}
      </div>
      {filteredProjects.length === 0 && (
        <div className="myworks-empty">
          <h2>No matching projects</h2>
          <p>Try another technology, category, or search term.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      </section>

      <ProjectModal
        project={selectedProject}
        originEl={selected?.origin}
        onClose={closeProject}
        onPrevious={() => selectAdjacentProject(-1)}
        onNext={() => selectAdjacentProject(1)}
      />
    </div>
  );
};

export default MyWorks;
