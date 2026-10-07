import { SectionHeading } from "@/components/ui/SectionHeading";
import { AccordionFAQ } from "@/components/ui/AccordionFAQ";
import { FAQ_HEADING, HOME_FAQS } from "@/content/home";

/** Session preparation and delivery questions. */
export function FaqSection() {
  return (
    <section id="faq" className="py-14 sm:py-20 lg:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <SectionHeading {...FAQ_HEADING} />
      <div className="reveal">
        <AccordionFAQ items={HOME_FAQS} />
      </div>
    </section>
  );
}
