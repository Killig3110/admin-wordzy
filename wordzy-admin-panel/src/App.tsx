
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, BookOpen, FolderOpen, HelpCircle } from "lucide-react";
import Layout from "./components/Layout";
import TopicForm from './components/TopicForm';
import LessonForm from './components/LessonForm';
import WordForm from './components/WordForm';
import QuestionForm from './components/QuestionForm';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Layout>
      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Topics</span>
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            <span>Lessons</span>
          </TabsTrigger>
          <TabsTrigger value="words" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Words</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Questions</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="topics" className="focus:outline-none">
          <div className="wordzy-card">
            <TopicForm />
          </div>
        </TabsContent>
        
        <TabsContent value="lessons" className="focus:outline-none">
          <div className="wordzy-card">
            <LessonForm />
          </div>
        </TabsContent>
        
        <TabsContent value="words" className="focus:outline-none">
          <div className="wordzy-card">
            <WordForm />
          </div>
        </TabsContent>
        
        <TabsContent value="questions" className="focus:outline-none">
          <div className="wordzy-card">
            <QuestionForm />
          </div>
        </TabsContent>
      </Tabs>
      <Toaster />
    </Layout>
  );
}

export default App;
