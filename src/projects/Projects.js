import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import for navigation
import "./Projects.css";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false); // ✅ New state for instant fade-in

  useEffect(() => {
    setFadeIn(true); // ✅ Trigger fade-in as soon as component mounts

    const fetchRepos = async () => {
      try {
        const response = await fetch("https://api.github.com/users/tripzcodes/repos");
        if (!response.ok) throw new Error("Failed to fetch repositories");

        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return (
    <div className={`projects-container ${fadeIn ? "fade-in" : ""}`}>
      {/* ✅ Home Button */}
      <button className="home-button" onClick={() => navigate("/")}>
        ⬅ Home
      </button>

      <h1>Projects</h1>

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
