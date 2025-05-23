import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useNotify } from "../lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Plus } from "lucide-react";
import { fetchImageFromApi } from '@/api/fetchImage';
import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
    writeBatch,
    doc,
    limit,
} from 'firebase/firestore';
import { fetchDescriptionFromApi } from '@/api/fetchDescriptionFromApi';

export default function TopicForm() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [order, setOrder] = useState(0);
    const [maxOrder, setMaxOrder] = useState(0);
    const [status, setStatus] = useState('ACTIVE');
    const [loading, setLoading] = useState(false);
    const notify = useNotify();

    useEffect(() => {
        const fetchMaxOrder = async () => {
            const querySnapshot = await getDocs(query(
                collection(db, 'vocabulary_topics'),
                orderBy('order', 'desc'),
                limit(1)
            ));

            if (!querySnapshot.empty) {
                const maxOrder = querySnapshot.docs[0].data().order;
                setMaxOrder(maxOrder);
                setOrder(maxOrder + 1);
            } else {
                setOrder(1);
            }
        };

        fetchMaxOrder();
    }, []);


    const handleAutoImage = async () => {
        if (!name) {
            notify.error("Please enter topic name first");
            return;
        }

        setLoading(true);
        const url = await fetchImageFromApi(name);
        if (url) {
            setImage(url);
            notify.success("Image loaded from Pexels!");
        } else {
            notify.error("No image found or failed to fetch.");
        }
        setLoading(false);
    };

    const handleAutoDescription = async () => {
        if (!name) {
            notify.error("Vui lòng nhập tên chủ đề trước");
            return;
        }

        setLoading(true);
        const desc = await fetchDescriptionFromApi(name);
        if (desc) {
            setDescription(desc);
            notify.success("Đã sinh mô tả từ AI");
        } else {
            notify.error("Không thể sinh mô tả");
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const batch = writeBatch(db);

            // 🔥 Shift các topic có order >= order hiện tại
            const q = query(
                collection(db, 'vocabulary_topics'),
                where('order', '>=', order),
                orderBy('order', 'desc') // quan trọng: cập nhật từ cao xuống
            );

            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
                const data = docSnap.data();
                const ref = docSnap.ref;
                batch.update(ref, { order: data.order + 1 });
            });

            // 🔥 Add topic mới với order mới
            const newDocRef = doc(collection(db, 'vocabulary_topics'));
            batch.set(newDocRef, {
                topicId: newDocRef.id,
                topicName: name,
                description,
                image,
                order,
                status
            });

            await batch.commit();
            notify.success("Topic added successfully");

            setName('');
            setDescription('');
            setImage('');
            setOrder(0); // Hoặc fetch lại max + 1
            setStatus('ACTIVE');
        } catch (error) {
            notify.error("Failed to add topic");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <FolderOpen className="mr-2 h-5 w-5 text-primary" />
                    Create Topic
                </CardTitle>
                <CardDescription>
                    Add a new vocabulary topic to your collection
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <Label htmlFor="topic-name" className="form-label">Topic Name</Label>
                        <Input
                            id="topic-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter topic name"
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="form-group">
                        <Label htmlFor="description">Description</Label>
                        <div className="flex gap-2">
                            <Input
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Enter description or use AI"
                                className="w-full"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAutoDescription}
                                disabled={loading}
                            >
                                Tự động mô tả
                            </Button>
                        </div>
                    </div>

                    <div className="form-group">
                        <Label htmlFor="image">Image URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="image"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                placeholder="Enter image URL"
                                className="w-full"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAutoImage}
                                disabled={loading}
                                className="whitespace-nowrap"
                            >
                                Tự động lấy ảnh
                            </Button>
                        </div>

                        {/* Preview ảnh */}
                        {image && (
                            <div className="mt-3">
                                <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                                <img
                                    src={image}
                                    alt="Preview"
                                    className="rounded border max-h-48 object-cover"
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <Label htmlFor="order">Order</Label>
                        <Input
                            id="order"
                            type="number"
                            value={order}
                            min={1}
                            max={maxOrder + 1}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val <= maxOrder + 1) {
                                    setOrder(val);
                                } else {
                                    notify.error(`Giá trị tối đa là ${maxOrder + 1}`);
                                }
                            }}
                            className="w-full"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Topic
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
