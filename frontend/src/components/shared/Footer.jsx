import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

const FooterSection = ({ title, links }) => (
  <div>
    <h3 className="font-medium text-black mb-4">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="text-black/60 hover:text-black transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: "Product",
      links: [
        { to: "/#features", label: "Features" },
        { to: "/pricing", label: "Pricing" },
        { to: "/blog", label: "Blog" },
        { to: "/about", label: "About" }
      ]
    },
    {
      title: "Resources",
      links: [
        { to: "/cases", label: "Dashboard" },
        { to: "/consultancy", label: "Consultancy" }
      ]
    },
    {
      title: "Legal",
      links: [
        { to: "/privacy", label: "Privacy Policy" },
        { to: "/terms", label: "Terms of Service" }
      ]
    }
  ];

  return (
    <footer className="bg-accent-white border-t border-primary-main/5">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-black">
                Lexify
              </span>
            </div>
            <p className="text-black/60 mb-6">
              Transforming legal practice through innovative AI technology.
            </p>
          </div>

          {/* Links Sections */}
          {sections.map((section) => (
            <FooterSection
              key={section.title}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-primary-main/5">
          <p className="text-black/40 text-sm text-center">
            © {currentYear} Lexify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 