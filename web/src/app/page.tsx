import Link from 'next/link';
import { BookOpen, Users, Award, MessageSquare, Star, ArrowRight } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Structured Courses', desc: 'Learn Arabic from basics to advanced with organized modules and lessons.' },
  { icon: Users, title: 'Expert Teachers', desc: 'Courses designed by experienced Arabic language instructors.' },
  { icon: Award, title: 'Tests & Quizzes', desc: 'Test your knowledge with interactive quizzes and track your progress.' },
  { icon: MessageSquare, title: 'AI Assistant', desc: 'Get instant help with translation, grammar, and practice questions.' },
];

const stats = [
  { value: '500+', label: 'Students' },
  { value: '50+', label: 'Lessons' },
  { value: '10+', label: 'Courses' },
  { value: '4.9', label: 'Rating' },
];

export default function HomePage() {
  return (
    <div>
      <section className="hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
            <Star size={14} className="text-yellow-300" /> Trusted by 500+ students worldwide
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Learn Arabic &<br/>Islamic Studies Online</h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto mb-10">Join our comprehensive platform with structured courses, AI-powered learning tools, and a supportive community.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/courses" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg">Browse Courses <ArrowRight size={18} /></Link>
            <Link href="/register" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-colors">Start Free</Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => <div key={s.label}><p className="text-3xl md:text-4xl font-bold text-emerald-600">{s.value}</p><p className="text-sm text-gray-500 mt-1">{s.label}</p></div>)}
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4"><f.icon size={24} /></div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">Join hundreds of students already improving their Arabic and Islamic knowledge.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg">Create Free Account <ArrowRight size={18} /></Link>
      </section>
    </div>
  );
}
