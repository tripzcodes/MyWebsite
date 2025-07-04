import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Projects.css";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);

    const fetchRepos = async () => {
      try {
        const response = await fetch("https://api.github.com/users/tripzcodes/repos");
        if (!response.ok) throw new Error("Failed to fetch repositories");

        const data = await response.json();
        sortRepos(data, sortOrder);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  const sortRepos = (repoData, order) => {
    const sortedRepos = [...repoData].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setRepos(sortedRepos);
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    sortRepos(repos, order);
  };

  return (
    <div className={`projects-container ${fadeIn ? "fade-in" : ""}`}>
      <button className="home-button" onClick={() => navigate("/")}>
        Home
      </button>

      <h1>PROJECTS</h1>
      
      <div className="sort-controls">
        <button 
          className={`sort-button ${sortOrder === "desc" ? "active" : ""}`}
          onClick={() => handleSortChange("desc")}
        >
          Newest First
        </button>
        <button 
          className={`sort-button ${sortOrder === "asc" ? "active" : ""}`}
          onClick={() => handleSortChange("asc")}
        >
          Oldest First
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading repositories...</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : (
        <ul className="projects-list">
          {repos.map((repo) => (
            <li key={repo.id} className="project-item">
              <h2 className="project-title">{repo.name}</h2>
              <p className="project-meta">
                Date: {new Date(repo.created_at).toISOString().split("T")[0]} |{" "}
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="source-code">
                  Source code
                </a>
              </p>
              <p>{repo.description || "No description available."}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Projects;