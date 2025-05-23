
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useNotify } from "../lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus } from "lucide-react";
import { Lesson } from '../types';

export default function WordForm() {
    const [form, setForm] = useState({
        word: '',
        wordType: 'NOUN',
        definition: '',
        pronunciation: '',
        pronunciationAudio: '',
        exampleSentence: '',
        viTranslationDefinition: '',
        viTranslation: '',
        image: '',
        lessonId: '',
    });
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const notify = useNotify();

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'lessons'));
                setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
            } catch (error) {
                console.error("Error fetching lessons:", error);
                notify.error("Failed to load lessons");
            }
        };
        fetchLessons();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAutoRefetchImage = async () => {
        if (!form.word) {
            notify.error("Please enter the word first");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/image?keyword=${encodeURIComponent(form.word)}`);
            const data = await res.json();

            if (data.imageUrl) {
                setForm(prev => ({ ...prev, image: data.imageUrl }));
                notify.success("Fetched new image!");
            } else {
                notify.error("No image found.");
            }
        } catch (err) {
            console.error("❌ Error fetching image:", err);
            notify.error("Failed to fetch image");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoFillWord = async () => {
        if (!form.word) {
            notify.error("Enter a word first");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/word-data?word=${encodeURIComponent(form.word)}`);
            const data = await res.json();

            if (data.error) {
                notify.error("Không tìm thấy dữ liệu cho từ này");
            } else {
                setForm(prev => ({
                    ...prev,
                    ...data
                }));
                notify.success("Đã tự động điền dữ liệu từ API!");
            }
        } catch (err) {
            console.error('❌ Error fetching word data:', err);
            notify.error("Lỗi khi gọi API tự động");
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
            await addDoc(collection(db, 'vocabulary_words'), {
                ...form,
                createdAt: new Date(),
            });
            setForm({
                word: '',
                wordType: 'NOUN',
                definition: '',
                pronunciation: '',
                pronunciationAudio: '',
                exampleSentence: '',
                viTranslationDefinition: '',
                viTranslation: '',
                image: '',
                lessonId: '',
            });
            notify.success("Word added successfully");
        } catch (error) {
            notify.error("Failed to add word");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-primary" />
                    Add Vocabulary Word
                </CardTitle>
                <CardDescription>
                    Create a new vocabulary word with definitions, translations, and examples
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <Label htmlFor="word" className="form-label">Word</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="word"
                                    name="word"
                                    value={form.word}
                                    onChange={handleChange}
                                    placeholder="Enter word"
                                    required
                                    className="w-full"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAutoFillWord}
                                    disabled={loading || !form.word}
                                >
                                    Tự động điền
                                </Button>
                            </div>
                        </div>

                        <div className="form-group">
                            <Label htmlFor="wordType" className="form-label">Word Type</Label>
                            <Select
                                value={form.wordType}
                                onValueChange={(value) => handleSelectChange("wordType", value)}
                            >
                                <SelectTrigger id="wordType" className="w-full">
                                    <SelectValue placeholder="Select word type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOUN">Noun</SelectItem>
                                    <SelectItem value="VERB">Verb</SelectItem>
                                    <SelectItem value="ADJECTIVE">Adjective</SelectItem>
                                    <SelectItem value="ADVERB">Adverb</SelectItem>
                                    <SelectItem value="PRONOUN">Pronoun</SelectItem>
                                    <SelectItem value="PREPOSITION">Preposition</SelectItem>
                                    <SelectItem value="CONJUNCTION">Conjunction</SelectItem>
                                    <SelectItem value="INTERJECTION">Interjection</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Tabs defaultValue="english" className="w-full">
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="english">English</TabsTrigger>
                            <TabsTrigger value="vietnamese">Vietnamese</TabsTrigger>
                        </TabsList>

                        <TabsContent value="english" className="space-y-4 pt-4">
                            <div className="form-group">
                                <Label htmlFor="definition" className="form-label">Definition</Label>
                                <Input
                                    id="definition"
                                    name="definition"
                                    value={form.definition}
                                    onChange={handleChange}
                                    placeholder="Enter definition"
                                    className="w-full"
                                />
                            </div>

                            <div className="form-group">
                                <Label htmlFor="pronunciation" className="form-label">Pronunciation</Label>
                                <Input
                                    id="pronunciation"
                                    name="pronunciation"
                                    value={form.pronunciation}
                                    onChange={handleChange}
                                    placeholder="e.g. /ˈwɜːd/"
                                    className="w-full"
                                />
                            </div>

                            <div className="form-group">
                                <Label htmlFor="exampleSentence" className="form-label">Example Sentence</Label>
                                <Input
                                    id="exampleSentence"
                                    name="exampleSentence"
                                    value={form.exampleSentence}
                                    onChange={handleChange}
                                    placeholder="Enter an example sentence"
                                    className="w-full"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="vietnamese" className="space-y-4 pt-4">
                            <div className="form-group">
                                <Label htmlFor="viTranslationDefinition" className="form-label">Vietnamese Definition</Label>
                                <Input
                                    id="viTranslationDefinition"
                                    name="viTranslationDefinition"
                                    value={form.viTranslationDefinition}
                                    onChange={handleChange}
                                    placeholder="Enter Vietnamese definition"
                                    className="w-full"
                                />
                            </div>

                            <div className="form-group">
                                <Label htmlFor="viTranslation" className="form-label">Vietnamese Translation</Label>
                                <Input
                                    id="viTranslation"
                                    name="viTranslation"
                                    value={form.viTranslation}
                                    onChange={handleChange}
                                    placeholder="Enter Vietnamese translation"
                                    className="w-full"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <Label htmlFor="pronunciationAudio" className="form-label">Audio URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="pronunciationAudio"
                                    name="pronunciationAudio"
                                    value={form.pronunciationAudio}
                                    onChange={handleChange}
                                    placeholder="URL to pronunciation audio"
                                    className="w-full"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        if (form.pronunciationAudio) {
                                            const audio = new Audio(form.pronunciationAudio);
                                            audio.play().catch(err => notify.error("Failed to play audio"));
                                        } else {
                                            notify.error("No audio URL available");
                                        }
                                    }}
                                >
                                    🔊
                                </Button>
                            </div>
                        </div>

                        <div className="form-group relative group">
                            <Label htmlFor="image" className="form-label">Image URL</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    id="image"
                                    name="image"
                                    value={form.image}
                                    onChange={handleChange}
                                    placeholder="URL to image"
                                    className="w-full pr-10"
                                />
                                {form.image && (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="text-gray-500 hover:text-gray-800"
                                        >
                                            🖼
                                        </button>
                                        <div className="absolute z-50 w-40 rounded border bg-white p-1 shadow-md hidden group-hover:block top-full left-0">
                                            <img
                                                src={form.image}
                                                alt="Preview"
                                                className="max-h-40 w-full object-cover rounded"
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAutoRefetchImage}
                                    disabled={loading}
                                >
                                    🔁
                                </Button>
                            </div>
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

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Word
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
