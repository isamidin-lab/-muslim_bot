'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      api.getDashboard()
        .then(r => setCourses(r.data?.enrolledCourses || []))
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  if (authLoading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">My Courses</h1>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-2xl">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">No courses yet</h2>
          <p className="text-gray-500 mb-6">Start learning by enrolling in a course</p>
          <Link href="/courses" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
            Browse Courses <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c: any) => {
            const progress = c.progress || 0;
            const bar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
            return (
              <Link key={c.id || c.courseId} href={`/my-courses/${c.courseId || c.id}`} className="block bg-white border rounded-xl p-6 hover:border-emerald-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{c.course?.title || c.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{c.course?.description || c.description || ''}</p>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 mt-1" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{progress.toFixed(0)}%</span>
                </div>
                {c.startDate && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Clock size={12} /> Started {formatDate(c.startDate)}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
