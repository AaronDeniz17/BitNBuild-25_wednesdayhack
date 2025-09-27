// Home page for GigCampus
// Landing page with hero section and features

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  CheckIcon,
  StarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultRedirect } from '../lib/auth';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to the appropriate dashboard based on user role
      const dashboardPath = user.role === 'student' ? '/student/dashboard' : '/client/dashboard';
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  const features = [
    {
      icon: AcademicCapIcon,
      title: 'University Verified',
      description: 'Connect with verified students from your university and local area.',
    },
    {
      icon: BriefcaseIcon,
      title: 'Real Projects',
      description: 'Work on real projects from local businesses, clubs, and fellow students.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Fair Payment',
      description: 'Secure escrow system ensures you get paid for your work.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Safe & Secure',
      description: 'Built-in dispute resolution and secure payment processing.',
    },
    {
      icon: UserGroupIcon,
      title: 'Team Collaboration',
      description: 'Form teams with other students to tackle larger projects.',
    },
    {
      icon: StarIcon,
      title: 'Build Portfolio',
      description: 'Showcase your work and build a professional portfolio.',
    },
  ];

  const stats = [
    { label: 'Active Students', value: '2,500+' },
    { label: 'Projects Completed', value: '10,000+' },
    { label: 'Total Earnings', value: '$500K+' },
    { label: 'Universities', value: '50+' },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Computer Science Student',
      university: 'Stanford University',
      content: 'GigCampus helped me build my portfolio while earning money. I\'ve completed 15+ projects and made $3,000!',
      rating: 5,
    },
    {
      name: 'Mike Rodriguez',
      role: 'Business Student',
      university: 'UC Berkeley',
      content: 'The team collaboration features are amazing. I\'ve worked with students from different majors on exciting projects.',
      rating: 5,
    },
    {
      name: 'Emily Johnson',
      role: 'Design Student',
      university: 'Art Institute',
      content: 'Perfect platform for creative students. I\'ve designed logos, websites, and marketing materials for local businesses.',
      rating: 5,
    },
  ];

  return (
    <Layout showHeader={!isAuthenticated}>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 to-purple-800 text-white">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Connect. Create. Earn.
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
                The hyperlocal platform connecting students with real projects, 
                fair pay, and meaningful work experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50">
                  Get Started Free
                </Link>
                <Link href="/login" className="btn btn-lg border-white text-white hover:bg-white hover:text-primary-600">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose GigCampus?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're building the future of student freelancing with features 
                designed specifically for university communities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">
                Get started in minutes and start earning today
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Create Your Profile
                </h3>
                <p className="text-gray-600">
                  Sign up as a student or client, verify your university email, 
                  and showcase your skills.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Find Projects
                </h3>
                <p className="text-gray-600">
                  Browse projects from local businesses and students, 
                  or post your own project needs.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Work & Get Paid
                </h3>
                <p className="text-gray-600">
                  Collaborate with your team, complete milestones, 
                  and get paid securely through our escrow system.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Students Are Saying
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of students already earning on GigCampus
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="card p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.university}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join the GigCampus community today and start building your 
              portfolio while earning money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50">
                Sign Up Free
              </Link>
              <Link href="/how-it-works" className="btn btn-lg border-white text-white hover:bg-white hover:text-primary-600">
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
