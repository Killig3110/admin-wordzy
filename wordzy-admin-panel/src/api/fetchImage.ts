export async function fetchImageFromApi(keyword: string): Promise<string | null> {
    try {
        const res = await fetch(`http://localhost:8080/api/image?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        return data.imageUrl || null;
    } catch (err) {
        console.error('❌ Error fetching image:', err);
        return null;
    }
}
