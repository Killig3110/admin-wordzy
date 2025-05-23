import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection, getDocs, addDoc, orderBy, limit, query, writeBatch, where,
    doc
} from 'firebase/firestore';
import { useNotify } from "../lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, Plus } from "lucide-react";
import { Topic } from '../types';
import { fetchImageFromApi } from '@/api/fetchImage';
import { fetchDescriptionFromApi } from '@/api/fetchDescriptionFromApi';
import { fetchLessonTitleFromApi } from '@/api/fetchLessonTitleFromApi';

export default function LessonForm() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [difficulty, setDifficulty] = useState('EASY');
    const [expMax, setExpMax] = useState(100);
    const [status, setStatus] = useState('NOT_STARTED');
    const [order, setOrder] = useState(0);
    const [maxOrder, setMaxOrder] = useState(0);
    const [topicId, setTopicId] = useState('');
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const notify = useNotify();

    const statusMap: Record<string, { text: string; color: number }> = {
        NOT_STARTED: { text: 'Not Started', color: -11445920 },
        IN_PROGRESS: { text: 'In Progress', color: -256 },
        COMPLETED: { text: 'Completed', color: -16711936 },
    };

    useEffect(() => {
        const fetchData = async () => {
            const topicSnap = await getDocs(collection(db, 'vocabulary_topics'));
            setTopics(topicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));

            const maxOrderSnap = await getDocs(query(collection(db, 'lessons'), orderBy('order', 'desc'), limit(1)));
            const max = maxOrderSnap.empty ? 0 : maxOrderSnap.docs[0].data().order;
            setMaxOrder(max);
            setOrder(max + 1);
        };

        fetchData();
    }, []);

    const handleAutoLessonName = async () => {
        const selectedTopic = topics.find(t => t.topicId === topicId);
        const topicName = selectedTopic?.topicName || selectedTopic?.topicName;

        if (!topicName) {
            notify.error("Please select a topic first");
            return;
        }

        setLoading(true);
        const title = await fetchLessonTitleFromApi(topicName);
        if (title) setName(title);
        else notify.error("Failed to generate title");
        setLoading(false);
    };

    const handleAutoImage = async () => {
        if (!name) {
            notify.error("Enter lesson name first");
            return;
        }
        setLoading(true);
        const url = await fetchImageFromApi(name);
        if (url) setImage(url);
        else notify.error("No image found");
        setLoading(false);
    };

    const handleAutoDescription = async () => {
        if (!name) {
            notify.error("Enter lesson name first");
            return;
        }
        setLoading(true);
        const desc = await fetchDescriptionFromApi(name);
        if (desc) setDescription(desc);
        else notify.error("Failed to fetch description");
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicId) return notify.error("Select topic first");
        setLoading(true);

        try {
            const batch = writeBatch(db);

            // ⚠️ Shift lessons có order >= đang nhập
            const q = query(collection(db, 'lessons'), where('order', '>=', order), orderBy('order', 'desc'));
            const snap = await getDocs(q);
            snap.forEach(docSnap => {
                const ref = docSnap.ref;
                batch.update(ref, { order: docSnap.data().order + 1 });
            });

            // ✅ Tạo doc trước để lấy ID
            const lessonRef = doc(collection(db, 'lessons'));

            const statusInfo = statusMap[status];

            batch.set(lessonRef, {
                lessonId: lessonRef.id,
                lessonName: name,
                description,
                image,
                topicId,
                difficulty,
                expMax,
                status,
                statusText: statusInfo.text,
                statusColor: statusInfo.color,
                order
            });

            await batch.commit();

            notify.success("Lesson added successfully");
            setName('');
            setDescription('');
            setImage('');
            setDifficulty('EASY');
            setExpMax(100);
            setStatus('NOT_STARTED');
            setOrder(maxOrder + 2); // tiếp tục
            setTopicId('');
        } catch (error) {
            notify.error("Failed to add lesson");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Book className="mr-2 h-5 w-5 text-primary" />
                    Create Lesson
                </CardTitle>
                <CardDescription>Add a new lesson to a topic</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <Label>Lesson Name</Label>
                        <div className="flex gap-2">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full"
                            />
                            <Button
                                type="button"
                                onClick={handleAutoLessonName}
                                disabled={loading}
                            >
                                AI
                            </Button>
                        </div>
                    </div>
                    <div className="form-group">
                        <Label>Description</Label>
                        <div className="flex gap-2">
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" />
                            <Button type="button" onClick={handleAutoDescription} disabled={loading}>
                                AI
                            </Button>
                        </div>
                    </div>

                    <div className="form-group">
                        <Label>Image URL</Label>
                        <div className="flex gap-2">
                            <Input value={image} onChange={(e) => setImage(e.target.value)} className="w-full" />
                            <Button type="button" onClick={handleAutoImage} disabled={loading}>
                                Tự động
                            </Button>
                        </div>
                        {image && <img src={image} alt="preview" className="mt-2 max-h-40 rounded border" />}
                    </div>

                    <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={['EASY', 'INTERMEDIATE', 'ADVANCED']} />
                    <InputField label="EXP Max" type="number" value={expMax} onChange={setExpMax} />

                    <SelectField label="Status" value={status} onChange={setStatus} options={['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']} />
                    <InputField
                        label="Order"
                        type="number"
                        value={order}
                        min={1}
                        max={maxOrder + 1}
                        onChange={(val) => {
                            if (val <= maxOrder + 1) setOrder(val);
                            else notify.error(`Tối đa ${maxOrder + 1}`);
                        }}
                    />

                    <div className="form-group">
                        <Label>Select Topic</Label>
                        <Select value={topicId} onValueChange={setTopicId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                            <SelectContent>
                                {topics.map(t => (
                                    <SelectItem key={t.topicId} value={t.id}>{t.name || t.topicName || 'No name'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        <Plus className="mr-2 h-4 w-4" /> Add Lesson
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// 👇 Gợi ý 2 helper components

function InputField({ label, value, onChange, ...props }: any) {
    return (
        <div className="form-group">
            <Label>{label}</Label>
            <Input
                value={value}
                onChange={(e) => onChange(props.type === 'number' ? Number(e.target.value) : e.target.value)}
                {...props}
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: any) {
    return (
        <div className="form-group">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${label}`} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((o: string) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
