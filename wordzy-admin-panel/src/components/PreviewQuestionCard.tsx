import { VocabularyQuestion } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
    question: VocabularyQuestion;
}

const PreviewQuestionCard = ({ question }: Props) => {
    const isDialogue = question.questionType === 'DIALOGUE_PRACTICE';

    const renderDialogue = () => {
        try {
            const turns = JSON.parse(question.questionText || '[]');
            if (!Array.isArray(turns)) return null;

            return (
                <div className="space-y-2">
                    {turns.map((turn: any, i: number) => (
                        <div
                            key={i}
                            className="p-2 border rounded-md bg-muted"
                        >
                            <strong>{turn.speaker}:</strong> {turn.text}
                        </div>
                    ))}
                </div>
            );
        } catch {
            return <p className="text-sm text-muted-foreground italic">Invalid dialogue format</p>;
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Question Preview</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                        {question.questionType}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md bg-secondary p-4">
                    <h3 className="font-medium">Question:</h3>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm">
                        {isDialogue ? renderDialogue() : question.questionText}
                    </div>
                </div>

                {question.options && question.options.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-medium">Options:</h3>
                        <ul className="space-y-2">
                            {question.options.map((opt, i) => (
                                <li
                                    key={i}
                                    className={`p-2 border rounded-md ${opt === question.correctAnswer
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    {opt} {opt === question.correctAnswer &&
                                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-300">
                                            Correct
                                        </Badge>
                                    }
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!question.options?.includes(question.correctAnswer) && question.correctAnswer && (
                    <div className="p-2 border rounded-md border-green-500 bg-green-50">
                        <h3 className="font-medium">Correct Answer:</h3>
                        <p className="mt-1">{question.correctAnswer}</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    {question.audio && (
                        <div className="flex-1">
                            <h3 className="font-medium mb-2">Audio:</h3>
                            <audio
                                controls
                                src={question.audio}
                                className="w-full"
                            />
                        </div>
                    )}

                    {question.image && (
                        <div className="flex-1">
                            <h3 className="font-medium mb-2">Image:</h3>
                            <img
                                src={question.image}
                                alt="Question visual"
                                className="w-auto max-h-32 rounded-md"
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PreviewQuestionCard;
