import { PortableText } from "@portabletext/react";
import { IconCheck, IconPackage } from "@tabler/icons-react";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import type { CAPABILITIES_QUERYResult } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { ProjectDemoButton } from "./ProjectDemoButton";

const CAPABILITIES_QUERY = defineQuery(`*[_type == "service"] | order(order asc, _createdAt desc){
  title,
  slug,
  icon,
  shortDescription,
  fullDescription,
  features,
  technologies[]->{name, category},
  deliverables,
  featured,
  order,
  proofProject->{
    title,
    slug,
    demoAction
  }
}`);

const CAPABILITIES_PROFILE_QUERY = defineQuery(`*[_id == "singleton-profile"][0]{
  availability,
  location,
  yearsOfExperience
}`);

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available for hire",
  open: "Open to opportunities",
  unavailable: "Not currently looking",
};

const ENGAGEMENT_TYPES = [
  {
    label: "Full-Time",
    description: "Senior frontend, full-stack, or AI-forward engineering roles",
  },
  {
    label: "Contract",
    description: "Scoped 3–6 month engagements with clear deliverables",
  },
  {
    label: "Advisory",
    description: "Architecture reviews, CMS strategy, and AI integration guidance",
  },
];

const IDEAL_ROLES = [
  "Senior Frontend Engineer",
  "Full-Stack Engineer",
  "AI-Forward Engineer",
  "Platform Engineer",
];

type Capability = CAPABILITIES_QUERYResult[number];

function CapabilityCard({
  capability,
  variant,
}: {
  capability: Capability;
  variant: "featured" | "compact";
}) {
  const proof = capability.proofProject;
  const isFeatured = variant === "featured";

  return (
    <div
      className={
        isFeatured
          ? "@container/card bg-card border-2 border-primary/20 rounded-lg p-6 @lg/card:p-8 hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col"
          : "@container/card bg-card border rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col"
      }
    >
      {capability.icon && (
        <div
          className={
            isFeatured
              ? "relative w-12 h-12 @md/card:w-16 @md/card:h-16 mb-4 @md/card:mb-6"
              : "relative w-10 h-10 @md/card:w-12 @md/card:h-12 mb-4"
          }
        >
          <Image
            src={urlFor(capability.icon).width(64).height(64).url()}
            alt={capability.title || "Capability"}
            fill
            className="object-contain"
          />
        </div>
      )}

      <h3
        className={
          isFeatured
            ? "text-xl @md/card:text-2xl font-bold mb-3"
            : "text-lg @md/card:text-xl font-bold mb-2"
        }
      >
        {capability.title}
      </h3>

      {capability.shortDescription && (
        <p
          className={
            isFeatured
              ? "text-muted-foreground mb-4 text-base @md/card:text-lg"
              : "text-muted-foreground mb-4 text-sm @md/card:text-base flex-1"
          }
        >
          {capability.shortDescription}
        </p>
      )}

      {isFeatured && capability.fullDescription && (
        <div className="prose prose-sm dark:prose-invert mb-6">
          <PortableText value={capability.fullDescription} />
        </div>
      )}

      {capability.features && capability.features.length > 0 && (
        <div className={isFeatured ? "mb-6" : "mb-4"}>
          {isFeatured && (
            <h4 className="font-semibold mb-3 text-sm @md/card:text-base">
              What I&apos;d own:
            </h4>
          )}
          <ul className="space-y-2">
            {capability.features
              .slice(0, isFeatured ? undefined : 3)
              .map((feature, idx) => (
                <li
                  key={`${capability.title}-feature-${idx}`}
                  className="flex items-start gap-2"
                >
                  <IconCheck
                    className={
                      isFeatured
                        ? "w-4 h-4 @md/card:w-5 @md/card:h-5 text-primary mt-0.5 flex-shrink-0"
                        : "w-3.5 h-3.5 @md/card:w-4 @md/card:h-4 text-primary mt-0.5 flex-shrink-0"
                    }
                  />
                  <span
                    className={
                      isFeatured
                        ? "text-muted-foreground text-sm @md/card:text-base"
                        : "text-muted-foreground text-xs @md/card:text-sm line-clamp-2"
                    }
                  >
                    {feature}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {isFeatured &&
        capability.deliverables &&
        capability.deliverables.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm @md/card:text-base">
              Artifacts I produce:
            </h4>
            <ul className="space-y-2">
              {capability.deliverables.map((item, idx) => (
                <li
                  key={`${capability.title}-deliverable-${idx}`}
                  className="flex items-start gap-2"
                >
                  <IconPackage className="w-4 h-4 @md/card:w-5 @md/card:h-5 text-primary/70 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm @md/card:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {proof?.title && (
        <div
          className={`${isFeatured ? "mb-6 pt-4 border-t" : "mb-4 pt-4 border-t"} mt-auto`}
        >
          <p className="text-xs @md/card:text-sm text-muted-foreground mb-2">
            Proof project
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm @md/card:text-base">
              {proof.title}
            </span>
            {proof.demoAction?.label && proof.demoAction?.type && (
              <ProjectDemoButton
                label={proof.demoAction.label}
                type={proof.demoAction.type}
                target={proof.demoAction.target}
                variant="secondary"
                className="!px-3 !py-1.5 !text-xs"
              />
            )}
          </div>
        </div>
      )}

      {capability.technologies && capability.technologies.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {capability.technologies.map((tech, idx) =>
            tech?.name ? (
              <span
                key={`${capability.title}-tech-${idx}`}
                className="px-2 py-1 @md/card:px-3 text-xs rounded-full bg-primary/10 text-primary"
              >
                {tech.name}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

export async function ServicesSection() {
  const [{ data: capabilities }, { data: profile }] = await Promise.all([
    sanityFetch({ query: CAPABILITIES_QUERY }),
    sanityFetch({ query: CAPABILITIES_PROFILE_QUERY }),
  ]);

  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  const featured = capabilities.filter((c) => c.featured);
  const regular = capabilities.filter((c) => !c.featured);

  const availabilityLabel = profile?.availability
    ? AVAILABILITY_LABELS[profile.availability]
    : null;

  return (
    <section id="services" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What I Build &amp; Own
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Systems I&apos;ve shipped — and problems I&apos;d own on your team
          </p>
        </div>

        {(availabilityLabel || profile?.yearsOfExperience) && (
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3 text-sm">
            {availabilityLabel && (
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                {availabilityLabel}
              </span>
            )}
            {profile?.location && (
              <span className="px-4 py-2 rounded-full border text-muted-foreground">
                {profile.location}
              </span>
            )}
            {profile?.yearsOfExperience != null && (
              <span className="px-4 py-2 rounded-full border text-muted-foreground">
                {profile.yearsOfExperience}+ years shipping web &amp; AI
              </span>
            )}
          </div>
        )}

        {featured.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Core Strengths
            </h3>
            <div className="@container">
              <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-8">
                {featured.map((capability) => (
                  <CapabilityCard
                    key={capability.slug?.current || capability.title}
                    capability={capability}
                    variant="featured"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {regular.length > 0 && (
          <div className="mb-12">
            {featured.length > 0 && (
              <h3 className="text-2xl font-bold mb-6">Also Strong In</h3>
            )}
            <div className="@container">
              <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-6">
                {regular.map((capability) => (
                  <CapabilityCard
                    key={capability.slug?.current || capability.title}
                    capability={capability}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border rounded-xl p-6 @md:p-8">
          <h3 className="text-xl font-bold mb-6 text-center">
            How I&apos;m Looking to Engage
          </h3>
          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4 mb-8">
            {ENGAGEMENT_TYPES.map((type) => (
              <div
                key={type.label}
                className="rounded-lg border bg-muted/30 p-4 text-center"
              >
                <p className="font-semibold mb-1">{type.label}</p>
                <p className="text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Ideal roles</p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {IDEAL_ROLES.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1.5 text-sm rounded-full border text-muted-foreground"
                >
                  {role}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-accent transition-colors font-medium"
              >
                View Projects
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Let&apos;s Connect
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
