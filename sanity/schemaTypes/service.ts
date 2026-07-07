import { defineField, defineType } from "sanity";

export default defineType({
  name: "service",
  title: "Capabilities",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Capability Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon/Image",
      type: "image",
      options: {
        hotspot: true,
      },
      description: "Optional icon or illustration for this capability",
    }),
    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "text",
      rows: 2,
      description: "One-line value proposition",
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "fullDescription",
      title: "Full Description",
      type: "array",
      of: [{ type: "block" }],
      description: "Expanded narrative about this capability area",
    }),
    defineField({
      name: "features",
      title: "What I'd Own",
      type: "array",
      of: [{ type: "string" }],
      description: "Problems and responsibilities you'd own on a team",
    }),
    defineField({
      name: "technologies",
      title: "Technologies",
      type: "array",
      of: [{ type: "reference", to: [{ type: "skill" }] }],
    }),
    defineField({
      name: "deliverables",
      title: "Artifacts I Produce",
      type: "array",
      of: [{ type: "string" }],
      description: "Concrete outputs you ship in this area",
    }),
    defineField({
      name: "proofProject",
      title: "Proof Project",
      type: "reference",
      to: [{ type: "project" }],
      description: "A project that demonstrates this capability",
    }),
    defineField({
      name: "pricing",
      title: "Pricing (legacy)",
      type: "object",
      hidden: true,
      fields: [
        {
          name: "startingPrice",
          title: "Starting Price (USD)",
          type: "number",
        },
        {
          name: "priceType",
          title: "Price Type",
          type: "string",
          options: {
            list: [
              { title: "Per Hour", value: "hourly" },
              { title: "Per Project", value: "project" },
              { title: "Monthly Retainer", value: "monthly" },
              { title: "Custom Quote", value: "custom" },
            ],
          },
        },
        {
          name: "description",
          title: "Pricing Description",
          type: "text",
          rows: 2,
        },
      ],
    }),
    defineField({
      name: "timeline",
      title: "Typical Timeline (legacy)",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "featured",
      title: "Core Strength",
      type: "boolean",
      description: "Highlight as a primary capability (shown in featured grid)",
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
      title: "title",
      media: "icon",
      featured: "featured",
      proofTitle: "proofProject.title",
    },
    prepare(selection) {
      const { title, media, featured, proofTitle } = selection;
      const subtitle = proofTitle ? `Proof: ${proofTitle}` : undefined;
      return {
        title: featured ? `⭐ ${title}` : title,
        subtitle,
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
  ],
});
