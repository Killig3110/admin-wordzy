
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { VocabularyQuestion, Word } from '../types';
import PreviewQuestionCard from './PreviewQuestionCard';
import { useNotify } from "../lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Eye, Plus } from "lucide-react";
import { generateQuestions } from '@/api/generateQuestions';

const QUESTION_TYPES = [
    'MULTIPLE_CHOICE',
    'LISTEN_REWRITE',
    'MATCH_IMAGE',
    'PRONOUNCE',
    'LISTEN_REORDER',
    'LISTEN_DEFINITION_WRITE_WORD',
    'WORD_SELECT_DEFINITION',
    'WORD_SELECT_SYNONYM',
    'READ_PARAGRAPH_SELECT_MAIN_IDEA',
    'DIALOGUE_PRACTICE',
];

export default function QuestionForm() {
    const [lessons, setLessons] = useState<any[]>([]);
    const [words, setWords] = useState<any[]>([]);
    const [previewQuestion, setPreviewQuestion] = useState<VocabularyQuestion | null>(null);
    const [loading, setLoading] = useState(false);
    const notify = useNotify();
    const [generatedQuestions, setGeneratedQuestions] = useState<VocabularyQuestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [topics, setTopics] = useState<any[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState('');

    const [form, setForm] = useState({
        questionType: 'MULTIPLE_CHOICE',
        questionText: '',
        correctAnswer: '',
        explanation: '',
        options: '',
        audio: '',
        image: '',
        wordText: '',
        lessonId: '',
    });

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'vocabulary_topics'));
                setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                notify.error("Failed to load topics");
            }
        };
        fetchTopics();
    }, []);

    useEffect(() => {
        if (!selectedTopicId) return;

        const fetchLessons = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'lessons'));
                const filtered = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter((lesson: any) => lesson.topicId === selectedTopicId);
                setLessons(filtered);
            } catch (err) {
                notify.error("Failed to load lessons");
            }
        };
        fetchLessons();
    }, [selectedTopicId]);

    useEffect(() => {
        if (!form.lessonId) return;

        const fetchWords = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'vocabulary_words'));
                const filtered = snapshot.docs.map(doc => ({ wordId: doc.id, ...doc.data() }))
                    .filter((word: Word) => word.lessonId === form.lessonId);
                setWords(filtered);
            } catch (err) {
                notify.error("Failed to load words");
            }
        };
        fetchWords();
    }, [form.lessonId]);

    const handleGenerateAll = async () => {
        const selectedWord = words.find((w) => w.word === form.wordText);
        console.log("Selected Word:", selectedWord);

        if (!selectedWord) {
            notify.error("Please select a valid word.");
            return;
        }

        setLoading(true);
        try {
            const generated = await generateQuestions(selectedWord); // 👈 gửi full word object
            console.log("Generated Questions:", generated);
            setGeneratedQuestions(generated);
            setSelectedIndex(null);
            notify.success(`✅ Generated ${generated.length} questions`);
        } catch (err) {
            console.error(err);
            notify.error("❌ Failed to generate questions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lessonSnap = await getDocs(collection(db, 'lessons'));
                const wordSnap = await getDocs(collection(db, 'vocabulary_words'));
                setLessons(lessonSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setWords(wordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching data:", error);
                notify.error("Failed to load lessons and words");
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setForm(prev => {
            if (name === "topicId") {
                return { ...prev, topicId: value, lessonId: "", wordId: "" }; // reset dependent fields
            }
            if (name === "lessonId") {
                return { ...prev, lessonId: value, wordId: "" }; // reset word on lesson change
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSaveAll = async () => {
        if (!generatedQuestions.length) return;

        setLoading(true);
        try {
            for (const q of generatedQuestions) {
                const payload = {
                    ...q,
                    options: q.options || [],
                    createdAt: new Date(),
                };
                await addDoc(collection(db, 'vocabulary_questions'), payload);
            }

            notify.success("✅ All questions saved successfully");
            setGeneratedQuestions([]);
        } catch (err) {
            console.error(err);
            notify.error("❌ Failed to save questions");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.lessonId) {
            notify.error("Please select a lesson");
            return;
        }

        setLoading(true);
        try {
            const optionsArray = form.options
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt !== '');

            await addDoc(collection(db, 'vocabulary_questions'), {
                questionId: doc(collection(db, 'vocabulary_questions')).id,
                ...form,
                options: optionsArray,
                createdAt: new Date(),
            });

            notify.success("Question added successfully");
            setPreviewQuestion(null);

            // Reset form
            setForm({
                questionType: 'MULTIPLE_CHOICE',
                questionText: '',
                correctAnswer: '',
                explanation: '',
                options: '',
                audio: '',
                image: '',
                wordText: '',
                lessonId: '',
            });
        } catch (error) {
            notify.error("Failed to add question");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        const optionsArray = form.options
            .split(',')
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

        const preview: VocabularyQuestion = {
            ...form,
            options: optionsArray,
            lessonId: form.lessonId,
            questionType: form.questionType,
            questionText: form.questionText,
            correctAnswer: form.correctAnswer,
        };

        setPreviewQuestion(preview);
    };

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <HelpCircle className="mr-2 h-5 w-5 text-primary" />
                        Create Practice Question
                    </CardTitle>
                    <CardDescription>
                        Add a new practice question for vocabulary learning
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Topic Select */}
                    <div className="form-group">
                        <Label htmlFor="topicId">Topic</Label>
                        <Select
                            value={selectedTopicId}
                            onValueChange={(value) => {
                                setSelectedTopicId(value);
                                setForm(prev => ({ ...prev, lessonId: '', wordId: '' }));
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                            <SelectContent>
                                {topics.map((topic) => (
                                    <SelectItem key={topic.topicId} value={topic.topicId}>{topic.topicName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Lesson Select */}
                    <div className="form-group">
                        <Label htmlFor="lessonId">Lesson</Label>
                        <Select
                            value={form.lessonId}
                            onValueChange={(value) => handleSelectChange('lessonId', value)}
                            disabled={!selectedTopicId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a lesson" />
                            </SelectTrigger>
                            <SelectContent>
                                {lessons.map((lesson) => (
                                    <SelectItem key={lesson.lessonId} value={lesson.lessonId}>{lesson.lessonName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Word Select */}
                    <div className="form-group">
                        <Label htmlFor="wordId">Vocabulary Word</Label>
                        <Select
                            value={form.wordText}
                            onValueChange={(value) => handleSelectChange('wordText', value)}
                            disabled={!form.lessonId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a word" />
                            </SelectTrigger>
                            <SelectContent>
                                {words.map((word) => (
                                    <SelectItem key={word.wordId} value={word.word}>{word.word}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGenerateAll}
                            disabled={loading || !form.wordText}
                            className="flex-1"
                        >
                            Generate All AI Questions
                        </Button>

                        {generatedQuestions.length > 0 && (
                            <Button
                                type="button"
                                variant="default"
                                onClick={handleSaveAll}
                                disabled={loading}
                                className="flex-1"
                            >
                                Save All
                            </Button>
                        )}
                    </div>
                </CardContent>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <Label htmlFor="questionType" className="form-label">Question Type</Label>
                            <Select
                                value={form.questionType}
                                onValueChange={(value) => handleSelectChange("questionType", value)}
                            >
                                <SelectTrigger id="questionType" className="w-full">
                                    <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUESTION_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type.replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="form-group">
                            <Label htmlFor="questionText" className="form-label">Question Text</Label>
                            <Textarea
                                id="questionText"
                                name="questionText"
                                value={form.questionText}
                                onChange={handleChange}
                                placeholder="Enter your question"
                                className="w-full min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="form-group">
                                <Label htmlFor="correctAnswer" className="form-label">Correct Answer</Label>
                                <Input
                                    id="correctAnswer"
                                    name="correctAnswer"
                                    value={form.correctAnswer}
                                    onChange={handleChange}
                                    placeholder="Enter correct answer"
                                    className="w-full"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <Label htmlFor="options" className="form-label">Options (comma-separated)</Label>
                                <Input
                                    id="options"
                                    name="options"
                                    value={form.options}
                                    onChange={handleChange}
                                    placeholder="Option 1, Option 2, Option 3"
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="form-group">
                                <Label htmlFor="image">Image URL</Label>
                                <Input
                                    id="image"
                                    name="image"
                                    value={form.image}
                                    onChange={handleChange}
                                    placeholder="Enter image URL"
                                />
                            </div>
                            <div className="form-group">
                                <Label htmlFor="audio">Audio URL</Label>
                                <Input
                                    id="audio"
                                    name="audio"
                                    value={form.audio}
                                    onChange={handleChange}
                                    placeholder="Enter audio URL"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <Label htmlFor="lessonId" className="form-label">Lesson</Label>
                            <Select
                                value={form.lessonId}
                                onValueChange={(value) => handleSelectChange("lessonId", value)}
                            >
                                <SelectTrigger id="lessonId" className="w-full">
                                    <SelectValue placeholder="Select a lesson" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lessons.map(lesson => (
                                        <SelectItem key={lesson.lessonId} value={lesson.lessonId}>
                                            {lesson.lessonName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={loading}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Question
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePreview}
                                className="flex-1"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Question
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {previewQuestion && <PreviewQuestionCard question={previewQuestion} />}
            {generatedQuestions.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h2 className="text-xl font-semibold">AI-Generated Questions</h2>
                    {generatedQuestions.map((q, idx) => (
                        <div key={idx} className="p-4 border rounded-md relative group hover:shadow-sm">
                            <PreviewQuestionCard question={q} />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                                onClick={() => {
                                    setForm({
                                        questionType: q.questionType || '',
                                        questionText: q.questionText || '',
                                        correctAnswer: q.correctAnswer || '',
                                        explanation: q.explanation || '',
                                        options: (q.options || []).join(', '),
                                        audio: q.audio || '',
                                        image: q.image || '',
                                        wordText: q.wordId || '',
                                        lessonId: q.lessonId || '',
                                    });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                Edit
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
