export interface QuestionData {
    questionText: string;         // Nội dung câu hỏi (có thể là đoạn văn, câu hỏi ngắn, etc.)
    options: string[];            // Danh sách lựa chọn
    correctAnswer: string;        // Đáp án đúng
    paragraph?: string;           // ⬅️ Thêm dòng này
}
