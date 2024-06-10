import { useState, useEffect } from "react";
import githubLogo from "./assets/github.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface MenuItem {
  title: string;
  artist: string;
  videoId: string;
}

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedSong, setSelectedSong] = useState<MenuItem | null>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement
      .requestFullscreen()
      .catch((err) => console.error(err));
  }, []);

  async function fetchMenu(query: string) {
    setLoading(true);
    setError(null);
    try {
      const response: any = await invoke("get_menu", { query });
      if (response && response.items && Array.isArray(response.items)) {
        const items = response.items.map((item: any) => ({
          title: item.title,
          artist: item.artist,
          videoId: item.video_id,
        }));
        setMenuItems(items);
        setMenuExpanded(true);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError(
        "Error fetching menu: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMenu() {
    const input = (
      document.getElementById("greet-input") as HTMLInputElement
    ).value.trim();
    if (!input) {
      alert("Please select a song first");
      return;
    }
    fetchMenu(input);
  }

  function handleSelectSong(item: MenuItem) {
    setSelectedSong(item);
  }

  async function handleDownload() {
    if (selectedSong) {
      try {
        const url = `https://www.youtube.com/watch?v=${selectedSong.videoId}`;
        const title = selectedSong.title;
        alert("Downloading...");
        await invoke("download", { url, title });
        alert("Completed Download");
      } catch (error) {
        alert(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    } else {
      alert("Please select a song first");
    }
  }

  return (
    <div className="container">
      <h1>Youtube Downloader</h1>
      <div className="row">
        <a href="https://github.com/wisrude" target="_blank" rel="noreferrer">
          <img src={githubLogo} className="logo github" alt="Github logo" />
        </a>
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          toggleMenu();
        }}
      >
        <input id="greet-input" placeholder="Song" />
        <button type="button" className="icon-button" onClick={toggleMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="icon"
          >
            <path
              fillRule="evenodd"
              d="M4.5 6a1.5 1.5 0 0 1 1.5-1.5h12A1.5 1.5 0 0 1 19.5 6v.75a.75.75 0 0 1-1.5 0V6h-12v.75a.75.75 0 0 1-1.5 0V6Zm0 6a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v.75a.75.75 0 0 1-1.5 0V12h-12v.75a.75.75 0 0 1-1.5 0V12Zm0 6a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v.75a.75.75 0 0 1-1.5 0V18h-12v.75a.75.75 0 0 1-1.5 0V18Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {selectedSong && (
        <div className="selected-song">
          <p>{selectedSong.title}</p>
          <p>{selectedSong.artist}</p>
          <button onClick={handleDownload}>Download</button>
        </div>
      )}
      {menuExpanded && (
        <div className="menu-container">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index} onClick={() => handleSelectSong(item)}>
                <p>{item.title}</p>
                <p>{item.artist}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div id="downloadMessage" style={{ display: "none" }}>
        Downloading...
      </div>
    </div>
  );
}

export default App;
