import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BeerMug3D } from '@/components/BeerMug3D';

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

                Find your spot before <span className="text-amber-400">the foam spills over</span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed max-w-xl italic">
                "Secure your place before the foam takes over!"
              </p>

              <p className="text-lg text-slate-400 leading-relaxed max-w-xl mt-4">
                Quick internal reservations for offices, meeting rooms, hot‑desks and relaxation areas. Choose a space, book a slot and get to work.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/map"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-slate-900 rounded-lg font-semibold text-lg hover:bg-amber-400 transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-amber-500/50"
                >
                  <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
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

            {/* Right Column - 3D Beer Mug Model */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-lg">
                <BeerMug3D />
              </div>

              <div className="text-center mt-8">
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

        {/* Wave dividers - Beer effect */}
        <div className="absolute bottom-[-40px] left-0 right-0 w-full pointer-events-none select-none">
          {/* Foam wave (white-cream) */}
          <div className="absolute bottom-[60px] left-0 right-0 w-full h-[140px] z-20">
            <img 
              src="/beer-foam-wave.svg" 
              alt="Beer foam wave" 
              className="w-full h-full object-cover opacity-90" 
              style={{ display: 'block' }}
            />
          </div>
          
          {/* Beer wave (golden yellow) */}
          <div className="absolute bottom-0 left-0 right-0 w-full h-[140px] z-10">
            <img 
              src="/beer-wave.svg" 
              alt="Beer wave" 
              className="w-full h-full object-cover" 
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* Trust badges */}
        {/* Trust badges section removed as requested */}
      </section >

      {/* Footer - Golden beer color */}
      < footer className="bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-slate-900 py-16 border-t border-amber-600" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-md">
                  <img src="/logo.png" alt="SpaceFlow Logo" className="w-full h-full object-cover rounded-lg" />
                </div>
                <span className="text-xl font-bold text-slate-900">SpaceFlow</span>
              </div>
              <p className="text-slate-800 mb-6 max-w-md">
                Enterprise-grade meeting room booking platform with interactive 3D visualization
                and intelligent space management.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors text-amber-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors text-amber-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center transition-colors text-amber-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-slate-900 font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/booking" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Find a space</Link></li>
                <li><a href="#features" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Features</a></li>
                <li><a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Pricing</a></li>
                <li><a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-slate-900 font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">About Us</a></li>
                <li><a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Careers</a></li>
                <li><a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Contact</a></li>
                <li><a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-amber-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-800 text-sm font-medium">
              &copy; 2025 SpaceFlow. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Privacy Policy</a>
              <a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Terms of Service</a>
              <a href="#" className="text-slate-800 hover:text-slate-900 transition-colors font-medium">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Index;