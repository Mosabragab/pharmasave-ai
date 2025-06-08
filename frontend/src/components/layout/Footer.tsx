'use client'

import React from 'react';
import Link from 'next/link';
import { 
  Pill,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import { Button } from '../ui/button';

interface FooterProps {
  variant?: 'full' | 'minimal';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'full' }) => {
  if (variant === 'minimal') {
    return (
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <Pill className="w-5 h-5 text-pharmacy-green mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 PharmaSave AI. All rights reserved.
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center mb-4">
              <Pill className="w-6 h-6 text-pharmacy-green" />
              <span className="ml-2 text-xl font-bold dark:text-white">PharmaSave AI</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connecting pharmacists to reduce medicine waste and increase profits through our innovative platform.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              <Instagram className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              <Linkedin className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">About Us</Link></li>
              <li><Link href="/success-stories" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Success Stories</Link></li>
              <li><Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Careers</Link></li>
              <li><Link href="/press" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Press</Link></li>
              <li><Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Blog</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">How It Works</Link></li>
              <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</Link></li>
              <li><Link href="/documentation" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Documentation</Link></li>
              <li><Link href="/user-guides" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">User Guides</Link></li>
              <li><Link href="/api-docs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">API Documentation</Link></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 dark:text-white">Contact</h3>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-2" />
                <a href="mailto:support@pharmasave.ai" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  support@pharmasave.ai
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-2" />
                <a href="tel:+20123456789" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  +20 123 456 7890
                </a>
              </li>
            </ul>
            
            <div>
              <h4 className="font-semibold mb-2 dark:text-white">Subscribe to our newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-pharmacy-green dark:bg-gray-700 dark:text-white"
                />
                <Button className="rounded-l-none">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <Pill className="w-5 h-5 text-pharmacy-green mr-2" />
              <p className="text-gray-600 dark:text-gray-400">
                © 2025 PharmaSave AI. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
