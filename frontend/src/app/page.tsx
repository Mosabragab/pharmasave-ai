'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  ListPlus, 
  ShoppingCart, 
  HandshakeIcon, 
  Truck, 
  Star,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  MapPin,
  BarChart2,
  Clock,
  Brain,
  Send,
  Mail,
  Phone,
  Pill,
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { pageLayout, cardPatterns, buttonPatterns, statsPatterns } from '@/constants/designSystem';

export default function Home() {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <Layout variant="landing">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-pharmacy-green/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E8A6E' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className={pageLayout.container}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
                  Transform{' '}
                  <span className="text-pharmacy-green">Near-Expired</span>{' '}
                  Medicines Into Revenue
                </h1>
                <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-400">
                  Connect with verified pharmacy businesses to sell or trade near-expired medications before they become deadstock. Save 5,000-10,000 EGP monthly with our secure marketplace.
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button className={`${buttonPatterns.primary} text-lg px-8 py-4 w-full sm:w-auto`}>
                    Start Saving Money
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button className={`${buttonPatterns.outline} text-lg px-8 py-4 w-full sm:w-auto`}>
                    See How It Works
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pharmacy-green" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">60-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pharmacy-green" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Complete privacy protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pharmacy-green" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Verified pharmacies only</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-bold text-pharmacy-green mb-2">150,000+</div>
                  <div className="text-gray-600 dark:text-gray-400">Medications saved from expiration</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-bold text-pharmacy-green mb-2">2.5M+ EGP</div>
                  <div className="text-gray-600 dark:text-gray-400">Total savings for pharmacies</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Beautiful CSS-only Hero Image */}
                <div className="w-full h-[600px] bg-gradient-to-br from-pharmacy-green/20 via-purple-400/20 to-trust-blue/20 flex items-center justify-center relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pharmacy-green/10 via-purple-500/10 to-trust-blue/10" />
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231E8A6E' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'%3E%3C/circle%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                  
                  {/* Central Content */}
                  <div className="relative z-10 text-center p-8">
                    <div className="w-40 h-40 mx-auto mb-8 bg-white/90 dark:bg-slate-800/90 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
                      <div className="w-32 h-32 bg-gradient-to-br from-pharmacy-green/20 to-trust-blue/20 rounded-2xl flex items-center justify-center">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="w-4 h-4 bg-pharmacy-green rounded-full animate-pulse" />
                          <div className="w-4 h-4 bg-trust-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                          <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                          <div className="w-4 h-4 bg-pharmacy-green rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
                          <div className="w-4 h-4 bg-trust-blue rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      🏥 Modern Pharmacy Hub
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                      AI-Powered Medicine Management Platform
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <div className="flex items-center px-4 py-2 bg-pharmacy-green/10 rounded-full border border-pharmacy-green/20">
                        <CheckCircle className="w-5 h-5 text-pharmacy-green mr-2" />
                        <span className="text-pharmacy-green font-semibold">Secure Trading</span>
                      </div>
                      <div className="flex items-center px-4 py-2 bg-trust-blue/10 rounded-full border border-trust-blue/20">
                        <CheckCircle className="w-5 h-5 text-trust-blue mr-2" />
                        <span className="text-trust-blue font-semibold">Verified Pharmacies</span>
                      </div>
                      <div className="flex items-center px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                        <CheckCircle className="w-5 h-5 text-purple-500 mr-2" />
                        <span className="text-purple-500 font-semibold">AI Analytics</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Decorative Elements */}
                  <div className="absolute top-8 left-8 w-6 h-6 bg-pharmacy-green/40 rounded-full animate-bounce" />
                  <div className="absolute top-16 right-12 w-4 h-4 bg-trust-blue/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute bottom-12 left-16 w-5 h-5 bg-purple-500/40 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
                  <div className="absolute bottom-8 right-8 w-4 h-4 bg-orange-500/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-pharmacy-green/20 to-transparent"></div>
              </div>
              
              {/* Floating decorative elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-pharmacy-green/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Pill className="w-10 h-10 text-pharmacy-green" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/90 dark:bg-slate-800/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-pharmacy-green/20">
                <Star className="w-8 h-8 text-pharmacy-green" />
              </div>
            </div>
          </div>
          
          {/* Process Flow Visualization */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dashed border-gray-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="bg-gray-50 dark:bg-slate-800 px-6 py-3 rounded-full">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Start earning money in as little as 48 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-slate-800">
        <div className={pageLayout.container}>
          <div className={pageLayout.pageHeader.container}>
            <div className="text-center mx-auto max-w-3xl">
              <h2 className={pageLayout.pageHeader.title}>How It Works</h2>
              <p className={pageLayout.pageHeader.subtitle}>Simple process, proven results. Start saving money in just 3 steps.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className={`${cardPatterns.base} relative overflow-hidden group hover:shadow-lg transition-shadow duration-300`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="absolute top-4 left-4 w-8 h-8 bg-pharmacy-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="pt-8">
                  <div className="w-16 h-16 bg-pharmacy-green/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-8 h-8 text-pharmacy-green" />
                  </div>
                  <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Register & Verify</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Create your pharmacy business account and complete our secure verification process. Get verified in under 48 hours.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className={`${cardPatterns.base} relative overflow-hidden group hover:shadow-lg transition-shadow duration-300`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="absolute top-4 left-4 w-8 h-8 bg-pharmacy-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="pt-8">
                  <div className="w-16 h-16 bg-pharmacy-green/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ListPlus className="w-8 h-8 text-pharmacy-green" />
                  </div>
                  <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">List & Browse</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Create listings for near-expired medicines with AI-suggested pricing, or browse available medications from verified pharmacies nearby.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className={`${cardPatterns.base} relative overflow-hidden group hover:shadow-lg transition-shadow duration-300`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="absolute top-4 left-4 w-8 h-8 bg-pharmacy-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="pt-8">
                  <div className="w-16 h-16 bg-pharmacy-green/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <HandshakeIcon className="w-8 h-8 text-pharmacy-green" />
                  </div>
                  <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Trade & Earn</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Complete secure transactions through our platform. Sell, trade, or purchase medicines while maintaining complete business privacy.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white dark:bg-slate-900">
        <div className={pageLayout.container}>
          <div className={pageLayout.pageHeader.container}>
            <div className="text-center mx-auto max-w-3xl">
              <h2 className={pageLayout.pageHeader.title}>Why Choose PharmaSave AI?</h2>
              <p className={pageLayout.pageHeader.subtitle}>Transform potential losses into opportunities with our proven platform</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className={`${cardPatterns.base} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-pharmacy-green to-pharmacy-green/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Significant Cost Savings</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">Save 5,000-10,000 EGP monthly by efficiently managing near-expired medications through our secure marketplace platform.</CardDescription>
              </CardContent>
            </Card>

            <Card className={`${cardPatterns.base} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-trust-blue to-trust-blue/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Enhanced Privacy Protection</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">Your pharmacy's identity remains completely anonymous until transactions are approved, protecting your business reputation.</CardDescription>
              </CardContent>
            </Card>

            <Card className={`${cardPatterns.base} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Smart Geographic Matching</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">Connect with verified pharmacies within your preferred radius for efficient, cost-effective medication exchange.</CardDescription>
              </CardContent>
            </Card>

            <Card className={`${cardPatterns.base} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BarChart2 className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Data-Driven Insights</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">Access detailed analytics and reports to optimize inventory management and reduce future medication losses.</CardDescription>
              </CardContent>
            </Card>

            <Card className={`${cardPatterns.base} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">AI-Powered Pricing</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">Get intelligent pricing recommendations based on real market data, expiration dates, and demand patterns.</CardDescription>
              </CardContent>
            </Card>

            <Card className={`${cardPatterns.base} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-4 text-gray-900 dark:text-white">Time-Efficient Process</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">Streamlined listing and transaction process saves valuable staff time and operational resources.</CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-20">
            <div className="relative overflow-hidden bg-gradient-to-r from-pharmacy-green via-pharmacy-green to-trust-blue rounded-3xl p-12 text-white">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'%3E%3C/circle%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
              
              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold mb-4 leading-tight">
                      Ready to Increase Your Profits?
                    </h3>
                    <p className="text-lg leading-relaxed text-white/90">
                      Join 500+ verified pharmacy businesses saving money and reducing medicine waste. 
                      At just 999 EGP monthly, our platform pays for itself with the first transaction.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/auth/signup">
                      <Button className="bg-white text-pharmacy-green hover:bg-gray-100 font-semibold px-8 py-4 text-lg w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300">
                        Start Free Trial
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Button className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-pharmacy-green font-semibold px-8 py-4 text-lg w-full sm:w-auto transition-all duration-300">
                      Watch Demo
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span className="text-sm text-white/90">60-day free trial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span className="text-sm text-white/90">No long-term contracts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span className="text-sm text-white/90">Cancel anytime</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-colors duration-300">
                    <div className="text-2xl font-bold mb-2">150,000+</div>
                    <div className="text-sm text-white/80">Medications saved</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-colors duration-300">
                    <div className="text-2xl font-bold mb-2">2.5M+ EGP</div>
                    <div className="text-sm text-white/80">Total savings</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-colors duration-300">
                    <div className="text-2xl font-bold mb-2">500+</div>
                    <div className="text-sm text-white/80">Active pharmacies</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-colors duration-300">
                    <div className="text-2xl font-bold mb-2">98%</div>
                    <div className="text-sm text-white/80">Satisfaction rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50 dark:bg-slate-800">
        <div className={pageLayout.container}>
          <div className={pageLayout.pageHeader.container}>
            <div className="text-center mx-auto max-w-3xl">
              <h2 className={pageLayout.pageHeader.title}>Get in Touch</h2>
              <p className={pageLayout.pageHeader.subtitle}>
                Ready to transform your pharmacy's profitability? Our team is here to help you get started.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <Card className={`${cardPatterns.base} shadow-xl`}>
              <CardContent className={cardPatterns.padding.lg}>
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Send us a message
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </div>
                
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white transition-colors duration-200"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white transition-colors duration-200"
                        placeholder="+20 123 456 7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white transition-colors duration-200"
                      placeholder="your.email@pharmacy.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      How can we help you? *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-pharmacy-green focus:border-pharmacy-green dark:bg-slate-700 dark:text-white transition-colors duration-200 resize-none"
                      placeholder="Tell us about your pharmacy and how we can help you save money..."
                      required
                    ></textarea>
                  </div>

                  <Button 
                    type="submit" 
                    className={`${buttonPatterns.primary} w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    Send Message
                    <Send className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    We typically respond within 24 hours during business days.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Quick Contact */}
              <Card className={cardPatterns.base}>
                <CardContent className={cardPatterns.padding.lg}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Get in touch directly
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-pharmacy-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-pharmacy-green" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Email Support</h4>
                        <a 
                          href="mailto:support@pharmasave.ai" 
                          className="text-pharmacy-green hover:text-pharmacy-green/80 transition-colors"
                        >
                          support@pharmasave.ai
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          For general inquiries and support
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-trust-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-trust-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Phone Support</h4>
                        <a 
                          href="tel:+20123456789" 
                          className="text-trust-blue hover:text-trust-blue/80 transition-colors"
                        >
                          +20 123 456 7890
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Available during business hours
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Office Hours */}
              <Card className={cardPatterns.base}>
                <CardContent className={cardPatterns.padding.lg}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Business Hours
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Monday - Friday</span>
                      <span className="font-semibold text-gray-900 dark:text-white">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Saturday</span>
                      <span className="font-semibold text-gray-900 dark:text-white">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Sunday</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">Closed</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-pharmacy-green/5 dark:bg-pharmacy-green/10 rounded-xl border border-pharmacy-green/20">
                    <p className="text-sm text-pharmacy-green dark:text-pharmacy-green/90 font-medium">
                      💡 Tip: For faster support, email us with your pharmacy details and specific questions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Link */}
              <Card className={`${cardPatterns.base} bg-gradient-to-br from-pharmacy-green/5 to-trust-blue/5 border-pharmacy-green/20`}>
                <CardContent className={cardPatterns.padding.lg}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Need Quick Answers?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Check out our frequently asked questions for instant answers to common inquiries.
                  </p>
                  <Button className={buttonPatterns.outline}>
                    View FAQ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
