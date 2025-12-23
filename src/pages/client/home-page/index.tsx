import React from "react";
import HeroSection from "../../../components/home/HeroSection";
import FeaturesSection from "../../../components/home/FeaturesSection";
import HowItWorksSection from "../../../components/home/HowItWorksSection";
import CTASection from "../../../components/home/CTASection";
// import ExpertsSection from "../../../components/home/ExpertsSection";


const HomePage: React.FC = () => {

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      {/* <ExpertsSection /> */}
      {/* <TestimonialsSection /> */}
      <HowItWorksSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
