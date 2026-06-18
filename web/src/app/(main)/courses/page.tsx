'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BookOpen, Users, Clock } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getCourses().then(r => setCourses(r.data?.data || [])).catch(console.error).finally(() => setLoading(false)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Our Courses</h1>
        <p className="text-gray-500 max-w-lg mx-auto">Explore our structured courses designed to help you master Arabic and Islamic studies.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20"><BookOpen size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 text-lg">No courses available yet</p><p className="text-gray-400 text-sm mt-1">Check back soon!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`} className="course-card bg-white rounded-2xl border overflow-hidden hover:border-emerald-200">
              <div className="h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <BookOpen size={48} className="text-white/80" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {course.isPublished && <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Published</span>}
                  {course.isFeatured && <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description || 'No description available'}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><BookOpen size={14} />{course._count?.modules || 0} modules</span>
                  <span className="flex items-center gap-1"><Users size={14} />{course._count?.progresses || 0} students</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
