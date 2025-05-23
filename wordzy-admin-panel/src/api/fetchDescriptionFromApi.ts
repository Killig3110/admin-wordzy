export async function fetchDescriptionFromApi(keyword: string): Promise<string | null> {
    try {
        const res = await fetch(`http://localhost:8080/api/description?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        return data.description || null;
    } catch (err) {
        console.error('❌ Error fetching description:', err);
        return null;
    }
}
