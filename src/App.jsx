import { useEffect, useState } from "react";

const API_URL = "https://med-backend-vmgf.onrender.com/materials";

export default function App() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Telegram WebApp integration
  useEffect(() => {
    if (window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.ready();
    }
  }, []);

  // Fetch materials
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setMaterials(data);
      } catch (err) {
        console.log("Xatolik:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">📚 KattaBaza Materiallari</h1>

      {materials.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl shadow p-3 flex flex-col gap-3"
        >
          {/* Preview Image */}
          {item.preview_url ? (
            <img
              src={item.preview_url}
              alt="preview"
              className="rounded-lg w-full object-cover"
            />
          ) : (
            <div className="bg-gray-200 h-40 rounded-lg flex items-center justify-center text-gray-500">
              Rasm yo‘q
            </div>
          )}

          {/* Title */}
          <h2 className="text-lg font-semibold">{item.title}</h2>

          {/* Info */}
          <div className="text-sm text-gray-600">
            <p>Versiya: {item.version || "–"}</p>
            <p>Fayl turi: {item.file_type || "–"}</p>
            <p>Platforma: {item.platform || "–"}</p>
          </div>

          {/* Download button */}
          <a
            href={item.post_link}
            target="_blank"
            className="bg-blue-500 text-white text-center py-2 rounded-lg font-semibold"
          >
            Yuklab olish
          </a>
        </div>
      ))}
    </div>
  );
}
