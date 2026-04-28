import React from 'react';
import { Hero } from '../sections/Hero';
import { Skills } from '../sections/Skills';
import { Projects } from '../sections/Projects';
import { Blogs } from '../sections/Blogs';
import { CodingProfiles } from '../sections/CodingProfiles';
import { Footer } from '../sections/Footer';



export const Main: React.FC = () => {
  return (
    <>
    <div>
      <Hero/>
      <Skills />
      <Projects />
      <Blogs />
      <CodingProfiles />
      <Footer />
    </div>
    </>
  );
};