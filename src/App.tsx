/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, LearningProfile, Course, CourseLesson, UserProgress, QuizSubmission } from './types';
import { TopBar } from './components/TopBar';
import { CourseCatalog } from './components/CourseCatalog';
import { CourseGenerator } from './components/CourseGenerator';
import { LessonStage } from './components/LessonStage';
import { MasteryDashboard } from './components/MasteryDashboard';
import { OnboardingModal } from './components/OnboardingModal';
import { DevDocsModal } from './components/DevDocsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'generator' | 'mastery' | 'lesson'>('catalog');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<LearningProfile | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);

  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isTestHubOpen, setIsTestHubOpen] = useState(false);

  // 1. Initial Load: Fetch User, Profile, Courses
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch current authenticated user & profile
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
          setCurrentProfile(userData.profile);
        }

        // Fetch courses catalog
        const coursesRes = await fetch('/api/courses');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);

          // Load progress for each course
          const initialProgressMap: Record<string, UserProgress> = {};
          for (const c of coursesData.courses || []) {
            const pRes = await fetch(`/api/courses/${c.id}/progress`);
            if (pRes.ok) {
              const pData = await pRes.json();
              initialProgressMap[c.id] = pData.progress;
            }
          }
          setProgressMap(initialProgressMap);
        }
      } catch (err) {
        console.error('Error loading initial app state:', err);
      }
    }

    loadInitialData();
  }, []);

  // 2. Real-Time Pub/Sub SSE Subscription
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime/events');

    eventSource.addEventListener('progress:updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgressMap((prev) => ({
          ...prev,
          [data.courseId]: {
            ...(prev[data.courseId] || {}),
            totalCompletionPercent: data.percent,
            completedLessonIds: Array.from(
              new Set([...(prev[data.courseId]?.completedLessonIds || []), data.lessonId])
            ),
          } as UserProgress,
        }));
      } catch (err) {}
    });

    eventSource.addEventListener('course:created', (e) => {
      // Refresh course list
      fetch('/api/courses')
        .then((r) => r.json())
        .then((data) => setCourses(data.courses || []))
        .catch(() => {});
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Handlers
  const handleSelectCourse = (course: Course) => {
    setActiveCourse(course);
    const firstLesson = course.modules[0]?.lessons[0] || null;
    setActiveLesson(firstLesson);
    setActiveTab('lesson');
  };

  const handleSelectLesson = (lesson: CourseLesson) => {
    setActiveLesson(lesson);
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!activeCourse) return;
    try {
      const res = await fetch(`/api/courses/${activeCourse.id}/lessons/${lessonId}/complete`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setProgressMap((prev) => ({
          ...prev,
          [activeCourse.id]: data.progress,
        }));
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  const handleSaveProfile = async (profileData: Partial<LearningProfile>) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleSwitchPersona = async () => {
    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: currentUser?.role === 'learner' ? 'mentor' : 'learner' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setCurrentProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  const handleCourseGenerated = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev]);
    handleSelectCourse(newCourse);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 3-Zone Top Navigation Bar */}
      <TopBar
        activeTab={activeTab === 'lesson' ? 'catalog' : activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'catalog') setActiveCourse(null);
        }}
        currentUser={currentUser}
        onOpenTestHub={() => setIsTestHubOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onSwitchPersona={handleSwitchPersona}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'catalog' && (
          <CourseCatalog
            courses={courses}
            progressMap={progressMap}
            onSelectCourse={handleSelectCourse}
            onOpenGenerator={() => setActiveTab('generator')}
          />
        )}

        {activeTab === 'generator' && (
          <CourseGenerator
            userProfile={currentProfile}
            onCourseGenerated={handleCourseGenerated}
          />
        )}

        {activeTab === 'lesson' && activeCourse && activeLesson && (
          <LessonStage
            course={activeCourse}
            currentLesson={activeLesson}
            userProgress={progressMap[activeCourse.id] || null}
            onSelectLesson={handleSelectLesson}
            onCompleteLesson={handleCompleteLesson}
            onBackToCatalog={() => {
              setActiveCourse(null);
              setActiveLesson(null);
              setActiveTab('catalog');
            }}
          />
        )}

        {activeTab === 'mastery' && (
          <MasteryDashboard
            user={currentUser}
            profile={currentProfile}
            courses={courses}
            progressMap={progressMap}
            submissions={submissions}
            onSelectCourse={handleSelectCourse}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Skolve</span>
            <span>·</span>
            <span>AI-Tailored Education Platform</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsTestHubOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Developer Hub & Automated Smoke Tests
            </button>
            <span>·</span>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Calibrate Profile
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentProfile={currentProfile}
        onSaveProfile={handleSaveProfile}
      />

      <DevDocsModal
        isOpen={isTestHubOpen}
        onClose={() => setIsTestHubOpen(false)}
      />
    </div>
  );
}
