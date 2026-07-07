import Image from "next/image";
import Link from "next/link";
import { IconSparkles } from "@tabler/icons-react";
import { defineQuery } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { ProjectDemoButton } from "./ProjectDemoButton";

const PROJECT_FIELDS = `{
  title,
  slug,
  tagline,
  description,
  highlights,
  category,
  liveUrl,
  githubUrl,
  coverImage,
  demoAction,
  technologies[]->{name, category, color}
}`;

const SPOTLIGHT_QUERY = defineQuery(
  `*[_type == "project" && spotlight == true] | order(order asc)[0...2]${PROJECT_FIELDS}`,
);

const FEATURED_QUERY = defineQuery(
  `*[_type == "project" && featured == true && spotlight != true] | order(order asc)[0...6]${PROJECT_FIELDS}`,
);

const CATEGORY_LABELS: Record<string, string> = {
  "web-app": "Web Application",
  "mobile-app": "Mobile App",
  "ai-ml": "AI/ML",
  "api-backend": "API / Backend",
  devops: "DevOps",
  "open-source": "Open Source",
  "cli-tool": "CLI Tool",
  "desktop-app": "Desktop App",
  "browser-extension": "Browser Extension",
  game: "Game",
  other: "Other",
};

type Project = {
  title?: string | null;
  slug?: { current?: string } | null;
  tagline?: string | null;
  description?: string | null;
  highlights?: string[] | null;
  category?: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  coverImage?: Parameters<typeof urlFor>[0];
  demoAction?: {
    label?: string | null;
    type?: "external" | "open-chat" | "scroll" | null;
    target?: string | null;
  } | null;
  technologies?: Array<{ name?: string | null } | null> | null;
};

function categoryLabel(category: string | null | undefined) {
  if (!category) return null;
  return CATEGORY_LABELS[category] ?? category;
}

function TechTags({
  technologies,
  slug,
}: {
  technologies: Project["technologies"];
  slug?: string;
}) {
  if (!technologies?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {technologies.slice(0, 5).map((tech) =>
        tech?.name ? (
          <span
            key={`${slug}-${tech.name}`}
            className="text-xs px-2 py-1 rounded-md bg-muted"
          >
            {tech.name}
          </span>
        ) : null,
      )}
      {technologies.length > 5 && (
        <span className="text-xs px-2 py-1 rounded-md bg-muted">
          +{technologies.length - 5}
        </span>
      )}
    </div>
  );
}

function ProjectActions({ project }: { project: Project }) {
  const demo = project.demoAction;

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {demo?.label && demo?.type ? (
        <ProjectDemoButton
          label={demo.label}
          type={demo.type}
          target={demo.target}
          className="flex-1 min-w-[140px]"
        />
      ) : project.liveUrl ? (
        <Link
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[140px] text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
        >
          Try FeedPilot
        </Link>
      ) : null}
      {project.githubUrl && (
        <Link
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors text-sm text-center"
        >
          GitHub
        </Link>
      )}
    </div>
  );
}

function SpotlightCard({ project }: { project: Project }) {
  return (
    <article className="group relative bg-card border-2 border-primary/20 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-lg">
          <IconSparkles className="w-3.5 h-3.5" />
          Spotlight
        </span>
      </div>

      {project.coverImage && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={urlFor(project.coverImage).width(800).height(450).url()}
            alt={project.title || "Project image"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent" />
        </div>
      )}

      <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col">
        <div>
          {project.category && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {categoryLabel(project.category)}
            </span>
          )}
          <h3 className="text-xl md:text-2xl font-bold mt-3 mb-2">
            {project.title || "Untitled Project"}
          </h3>
          {project.tagline && (
            <p className="text-muted-foreground text-sm md:text-base">
              {project.tagline}
            </p>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {project.description}
          </p>
        )}

        {project.highlights && project.highlights.length > 0 && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {project.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto space-y-4">
          <TechTags
            technologies={project.technologies}
            slug={project.slug?.current}
          />
          <ProjectActions project={project} />
        </div>
      </div>
    </article>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  return (
    <div className="group bg-card border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {project.coverImage && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={urlFor(project.coverImage).width(600).height(400).url()}
            alt={project.title || "Project image"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] group-hover:opacity-0 transition-opacity duration-300" />
        </div>
      )}

      <div className="p-4 md:p-6 space-y-3 md:space-y-4">
        <div>
          {project.category && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {categoryLabel(project.category)}
            </span>
          )}
          <h3 className="text-lg md:text-xl font-semibold mt-2 mb-2 line-clamp-2">
            {project.title || "Untitled Project"}
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm line-clamp-2">
            {project.tagline}
          </p>
        </div>

        <TechTags
          technologies={project.technologies}
          slug={project.slug?.current}
        />
        <ProjectActions project={project} />
      </div>
    </div>
  );
}

export async function ProjectsSection() {
  const [{ data: spotlight }, { data: featured }] = await Promise.all([
    sanityFetch({ query: SPOTLIGHT_QUERY }),
    sanityFetch({ query: FEATURED_QUERY }),
  ]);

  const spotlightProjects = (spotlight ?? []) as Project[];
  const featuredProjects = (featured ?? []) as Project[];

  if (spotlightProjects.length === 0 && featuredProjects.length === 0) {
    return null;
  }

  return (
    <section id="projects" className="py-20 px-6 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        {spotlightProjects.length > 0 && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
                Priority Capabilities
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                In-Demand Features, Built In
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Headless CMS and agentic AI chat — live on this site, not just
                slide-deck promises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {spotlightProjects.map((project) => (
                <SpotlightCard
                  key={project.slug?.current || project.title}
                  project={project}
                />
              ))}
            </div>
          </div>
        )}

        {featuredProjects.length > 0 && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {spotlightProjects.length > 0
                  ? "More Featured Work"
                  : "Featured Projects"}
              </h2>
              <p className="text-lg text-muted-foreground">
                Additional projects and client deliverables
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <FeaturedCard
                  key={project.slug?.current || project.title}
                  project={project}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
