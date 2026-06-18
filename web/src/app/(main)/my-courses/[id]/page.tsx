'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, BookOpen, CheckCircle, Lock, Play } from 'lucide-react';

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    api.getCourse(id).then(r => setCourse(r.data)).catch(() => router.push('/my-courses')).finally(() => setLoading(false));
  }, [params, router]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  if (!course) return null;

  const modules = course.modules || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/my-courses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6"><ArrowLeft size={16} />Back to my courses</Link>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
        <p className="text-emerald-100">{course.description}</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Course Content</h2>
      {modules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl"><p className="text-gray-500">Content coming soon</p></div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod: any, idx: number) => (
            <div key={mod.id} className="bg-white border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{mod.title}</h3>
                  <p className="text-xs text-gray-400">{mod.lessons?.length || 0} lessons</p>
                </div>
              </div>
              {mod.lessons && mod.lessons.length > 0 && (
                <div className="border-t">
                  {mod.lessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer">
                      {lesson.isFree ? <Play size={16} className="text-emerald-500" /> : <Lock size={16} className="text-gray-300" />}
                      <span className="text-sm flex-1">{lesson.title}</span>
                      {lesson.isFree && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Free</span>}
                      {lesson.duration && <span className="text-xs text-gray-400">{lesson.duration}m</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
