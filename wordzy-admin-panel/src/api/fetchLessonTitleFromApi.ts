export async function fetchLessonTitleFromApi(topicName: string): Promise<string | null> {
    try {
        const res = await fetch(`http://localhost:8080/api/lesson-title?keyword=${encodeURIComponent(topicName)}`);
        const data = await res.json();
        return data.title || null;
    } catch (err) {
        console.error('❌ Error fetching lesson title:', err);
        return null;
    }
}
