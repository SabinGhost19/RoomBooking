import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BeerMugIcon } from '@/components/BeerMugIcon';

const Index = () => {
  // Logged-in detection (simple heuristic): presence of a token in localStorage
  // Assumption: authentication stores a token under 'token' in localStorage.
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section with 3D Model */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Content */}
            <div className="text-white space-y-8">
              <div className="inline-block">
                <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase bg-amber-400/10 px-4 py-2 rounded-full border border-amber-400/20">
                  Internal Space Reservations
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Find your place
                <span className="block text-amber-400 mt-2">within the company</span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed max-w-xl italic">
                "Find the right spot for every day"
              </p>

              <p className="text-lg text-slate-400 leading-relaxed max-w-xl mt-4">
                Quick internal reservations for offices, meeting rooms, hot‑desks and relaxation areas. Choose a space, book a slot and get to work.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/map"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-slate-900 rounded-lg font-semibold text-lg hover:bg-amber-400 transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-amber-500/50"
                >
                  <BeerMugIcon className="w-6 h-6" />
                  {loggedIn ? 'Open map' : 'Find a space'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-lg font-semibold text-lg hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/20"
                >
                  View facilities
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold text-amber-400">50+</div>
                  <div className="text-sm text-slate-400 mt-1">Meeting Rooms</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">1000+</div>
                  <div className="text-sm text-slate-400 mt-1">Companies</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">99.9%</div>
                  <div className="text-sm text-slate-400 mt-1">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Column removed (no 3D model). Replace with clean call-to-action buttons. */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-2xl mb-6 shadow-xl mx-auto">
                  <BeerMugIcon className="w-10 h-10 text-slate-900" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Start booking meeting rooms</h2>
                <p className="text-slate-300 max-w-md mx-auto mb-6">Access interactive floor plans and real-time availability. Sign up to get full access.</p>

                <div className="flex items-center justify-center gap-4">
                  {!loggedIn ? (
                    <>
                      <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition">
                        Sign up
                      </Link>
                      <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition">
                        Sign in
                      </Link>
                    </>
                  ) : (
                    <Link to="/map" className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition">
                      Open Map
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-auto text-slate-50" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 66.7C480 53.3 600 46.7 720 50C840 53.3 960 66.7 1080 73.3C1200 80 1320 80 1380 80L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-wide">
              Enterprise Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 mt-3">
              Why Industry Leaders Choose Us
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Cutting-edge technology meets intuitive design for seamless room booking
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-slate-50 hover:bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Interactive 3D Floor Plans
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Visualize every meeting space with immersive 3D models. Navigate, rotate, and inspect rooms before booking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-slate-50 hover:bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Real-Time Availability
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Instant booking confirmations with live synchronization across all devices and platforms.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-slate-50 hover:bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Enterprise Security
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Bank-grade encryption, SSO integration, and compliance with industry standards (SOC 2, GDPR).
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-slate-50 hover:bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Team Collaboration
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Built for teams of all sizes. Calendar integrations, automated notifications, and resource management.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-slate-50 hover:bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Analytics & Insights
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Comprehensive reporting on room utilization, booking patterns, and space optimization metrics.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-slate-50 hover:bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                API Integration
              </h3>
              <p className="text-slate-600 leading-relaxed">
                RESTful API for seamless integration with existing systems. Slack, Teams, Google Workspace compatible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-2xl mb-8 shadow-xl">
            <BeerMugIcon className="w-10 h-10 text-slate-900" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Workspace?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join leading companies worldwide using our intelligent booking platform to optimize their meeting spaces.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/booking"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-slate-900 rounded-lg font-semibold text-lg hover:bg-amber-400 transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              Get Started Now
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="mailto:sales@roombooking.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-lg font-semibold text-lg hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/20"
            >
              Contact Sales
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-slate-400 text-sm mb-6">Trusted by industry leaders</p>
            <div className="flex items-center justify-center gap-12 opacity-50">
              <div className="text-white font-bold text-xl">ACME Corp</div>
              <div className="text-white font-bold text-xl">TechStart</div>
              <div className="text-white font-bold text-xl">GlobalCo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <BeerMugIcon className="w-6 h-6 text-slate-900" />
                </div>
                <span className="text-xl font-bold text-white">SpaceFlow</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Enterprise-grade meeting room booking platform with interactive 3D visualization
                and intelligent space management.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/booking" className="text-slate-400 hover:text-amber-400 transition-colors">Find a space</Link></li>
                <li><a href="#features" className="text-slate-400 hover:text-amber-400 transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; 2025 SpaceFlow. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-500 hover:text-amber-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-amber-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-amber-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;