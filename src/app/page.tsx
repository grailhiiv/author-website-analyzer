import { CallToAction } from "@/components/salient/CallToAction";
import { Faqs } from "@/components/salient/Faqs";
import { Hero } from "@/components/salient/Hero";
import { Pricing } from "@/components/salient/Pricing";
import { PrimaryFeatures } from "@/components/salient/PrimaryFeatures";
import { SecondaryFeatures } from "@/components/salient/SecondaryFeatures";
import { Testimonials } from "@/components/salient/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <PrimaryFeatures />
      <SecondaryFeatures />
      <CallToAction />
      <Testimonials />
      <Pricing />
      <Faqs />
    </>
  );
}
