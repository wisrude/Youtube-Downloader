use serde::{Deserialize, Serialize};
use tauri::command;
use reqwest::Client;
use rusty_ytdl::Video;

#[derive(Serialize, Deserialize, Clone)]
struct YoutubeResponse {
    items: Vec<Item>,
}

#[derive(Serialize, Deserialize, Clone)]
struct Item {
    snippet: Snippet,
    id: Id,
}

#[derive(Serialize, Deserialize, Clone)]
struct Snippet {
    title: String,
    #[serde(rename = "channelTitle")]
    channel_title: String,
    thumbnails: Thumbnails,
}

#[derive(Serialize, Deserialize, Clone)]
struct Id {
    #[serde(rename = "videoId")]
    video_id: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Thumbnails {
    default: Thumbnail,
    medium: Thumbnail,
    high: Thumbnail,
}

#[derive(Serialize, Deserialize, Clone)]
struct Thumbnail {
    url: String,
    width: u32,
    height: u32,
}

#[derive(Serialize)]
struct MenuResponse {
    items: Vec<MenuItem>,
}

#[derive(Serialize, Clone)]
struct MenuItem {
    title: String,
    artist: String,
    video_id: String, 
    thumbnails: Thumbnails,
}

#[command]
async fn get_menu(query: String) -> Result<MenuResponse, String> {
    let client = Client::new();
    let api_key = "YOUR_API_KEY";
    let url = format!(
        "https://www.googleapis.com/youtube/v3/search?key={}&part=snippet&type=video&maxResults=5&q={}",
        api_key, query
    );

    let response = match client.get(&url).send().await {
        Ok(response) => response,
        Err(err) => {
            eprintln!("Error request: {}", err);
            return Err(format!("API error: {}", err));
        }
    };

    let body = match response.text().await {
        Ok(body) => body,
        Err(err) => {
            eprintln!("Error reading response body: {}", err);
            return Err(format!("Failed to read response body: {}", err));
        }
    };

    let youtube_response: YoutubeResponse = match serde_json::from_str(&body) {
        Ok(data) => data,
        Err(err) => {
            eprintln!("Error parsing YouTube API response: {}", err);
            return Err(format!("Failed to parse API response: {}", err));
        }
    };

    println!("Respuesta de API:");
    for item in &youtube_response.items {
        println!("  - Título: {}", item.snippet.title);
        println!("    Artista: {}", item.snippet.channel_title);
        println!("    Video ID: {}", item.id.video_id);

    }

    let menu_items = youtube_response.items.iter().map(|item| MenuItem {
        title: item.snippet.title.clone(),
        artist: item.snippet.channel_title.clone(),
        thumbnails: item.snippet.thumbnails.clone(),
        video_id: item.id.video_id.clone(),
    }).collect();

    Ok(MenuResponse { items: menu_items })
}


#[command]
async fn download(url: String, title: String) -> Result<String, String> {
    println!("URL recibida: {}", url);
    println!("Título de la canción: {}", title);

    let video = match Video::new(&url) {
        Ok(video) => video,
        Err(err) => return Err(format!("Object Error: {:?}", err)),
    };

    let mut download_dir = dirs::download_dir().ok_or_else(|| "No se pudo obtener la carpeta de descargas del usuario".to_string())?;
    download_dir.push("Youtube-Downloader");
    std::fs::create_dir_all(&download_dir).map_err(|e| format!("Error al crear la carpeta de descargas: {:?}", e))?;

    let file_name = format!("{}.mp4", title);
    let file_path = download_dir.join(file_name);

    video
        .download(&file_path)
        .await
        .map_err(|e| format!("Download Error: {:?}", e))?;

    Ok(file_path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::command)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_menu, download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
