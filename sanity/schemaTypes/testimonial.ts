import { defineField, defineType } from "sanity";

// Keeps every quote within roughly the same rendered height in the
// testimonials carousel so the layout stays uniform across slides.
const MAX_TESTIMONIAL_WORDS = 50;

const countWords = (text: string) => text.trim().split(/\s+/).length;

export default defineType({
  name: "testimonial",
  title: "Testimonials",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Client/Person Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "position",
      title: "Position/Title",
      type: "string",
      description: "E.g., 'CTO', 'Product Manager', 'Founder'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "company",
      title: "Company/Organization",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "avatar",
      title: "Avatar/Photo",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "testimonial",
      title: "Testimonial",
      type: "text",
      rows: 5,
      description: `Keep it under ${MAX_TESTIMONIAL_WORDS} words so the carousel height stays uniform.`,
      validation: (Rule) =>
        Rule.required().custom((text?: string) => {
          if (!text) return true;
          const words = countWords(text);
          return words <= MAX_TESTIMONIAL_WORDS
            ? true
            : `Testimonial is ${words} words. Keep it under ${MAX_TESTIMONIAL_WORDS} to avoid overflowing the carousel.`;
        }),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      description: "1-5 stars",
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: "date",
      title: "Date Received",
      type: "date",
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn Profile",
      type: "url",
      description: "Link to person's LinkedIn for credibility",
    }),
    defineField({
      name: "companyLogo",
      title: "Company Logo",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "featured",
      title: "Featured Testimonial",
      type: "boolean",
      description: "Show on homepage",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "company",
      media: "avatar",
      featured: "featured",
    },
    prepare(selection) {
      const { title, subtitle, media, featured } = selection;
      return {
        title: featured ? `⭐ ${title}` : title,
        subtitle: subtitle,
        media: media,
      };
    },
  },
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Newest First",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
});
