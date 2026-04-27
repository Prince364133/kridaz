'use client';

import React from 'react';
const Image = (props: any) => <img {...props} />;
import { Eye, Heart, Share2, ChevronRight } from 'lucide-react';

const blogs = [
  {
    id: '01',
    title: "RISING STARS: KISHORE JENA AND NEERAJ CHOPRA - INDIA'S JAVELIN",
    date: "23rd July 2024",
    readTime: "2 mins read",
    views: "1.2k",
    likes: "450",
    image: "/images/blogs/javelin.png"
  },
  {
    id: '02',
    title: "EMPOWERING INNINGS: THE RISE OF WOMEN'S CRICKET WORLDWIDE",
    date: "11th July 2024",
    readTime: "3 mins read",
    views: "890",
    likes: "312",
    image: "/images/blogs/cricket.png"
  },
  {
    id: '03',
    title: "AND THAT WAS THE FINAL: ANALYZING THE CHAMPIONSHIP DECIDER",
    date: "20th May 2024",
    readTime: "1 min read",
    views: "2.4k",
    likes: "890",
    image: "/images/blogs/tennis.png"
  },
  {
    id: '04',
    title: "CRICKETING GLORY: INDIA'S WORLD CUP JOURNEY (1975-2023)",
    date: "17th May 2024",
    readTime: "5 mins read",
    views: "3.1k",
    likes: "1.2k",
    image: "/images/blogs/sprinter.png"
  }
];

const BlogsArticles = () => {
  return (
    <section className="bg-black py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-integral font-bold italic tracking-tighter text-white uppercase leading-none">
              BLOGS AND <span className="text-[#A1FF00]">ARTICLES</span>
            </h2>
            <p className="text-gray-500 font-medium tracking-wider text-xs md:text-sm uppercase">
              Insights, stories, and deep dives from the sports world
            </p>
          </div>
          
          <button className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest hover:text-[#A1FF00] transition-colors group">
            View All <ChevronRight className="w-4 h-4 text-[#A1FF00] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10 mb-12" />

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <div 
              key={blog.id}
              className="group relative h-[450px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 cursor-pointer transition-all duration-500 hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.1)]"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image 
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              </div>

              {/* Index Number */}
              <div className="absolute top-6 left-6 text-6xl font-integral font-bold text-white/5 uppercase select-none group-hover:text-white/10 transition-colors">
                {blog.id}
              </div>

              {/* Metadata */}
              <div className="absolute top-6 right-6 text-right">
                <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest mb-1">{blog.date}</p>
                <p className="text-[10px] text-[#A1FF00] uppercase font-bold tracking-widest">{blog.readTime}</p>
              </div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-8">
                <h3 className="text-xl md:text-2xl font-integral font-bold italic text-white uppercase leading-none mb-8 group-hover:text-[#A1FF00] transition-colors line-clamp-3">
                  {blog.title}
                </h3>

                <div className="w-full h-px bg-white/10 mb-6" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#A1FF00]" />
                      <span className="text-white/60 text-xs font-bold">{blog.views}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#A1FF00]" />
                      <span className="text-white/60 text-xs font-bold">{blog.likes}</span>
                    </div>
                  </div>

                  <button 
                    className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#A1FF00] hover:text-black hover:border-transparent transition-all duration-300"
                    aria-label="Share this article"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogsArticles;
