// fetch profile, experience, projects, skills, education, 
// certifications, achievements from sanity and format them into a 
// context object that can be used by the portfolio agent to answer questions 
// about the portfolio owner and their professional background


import { defineQuery } from "next-sanity";
import { client } from "@/sanity/lib/client";

export const PORTFOLIO_CONTEXT_QUERY = defineQuery(`{
  "profile": *[_id == "singleton-profile" && _type == "profile"][0]{
    firstName,
    lastName,
    headline,
    shortBio,
    "fullBioText": pt::text(fullBio),
    email,
    phone,
    location,
    availability,
    yearsOfExperience,
    socialLinks
  },
  "experience": *[_type == "experience"] | order(startDate desc)[0...10]{
    company,
    position,
    employmentType,
    location,
    startDate,
    endDate,
    current,
    "descriptionText": pt::text(description),
    responsibilities,
    achievements,
    "technologies": technologies[]->name
  },
  "projects": *[_type == "project" && featured == true] | order(order asc)[0...8]{
    title,
    tagline,
    category,
    liveUrl,
    githubUrl,
    "technologies": technologies[]->name
  },
  "skills": *[_type == "skill" && !(category in ["soft-skills", "mobile", "testing", "devops", "design"])] | order(category asc)[0...30]{
    name,
    category,
    proficiency,
    yearsOfExperience
  },
  "education": *[_type == "education"] | order(endDate desc)[0...5]{
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    current,
    description
  },
  "certifications": *[_type == "certification"] | order(issueDate desc)[0...8]{
    name,
    issuer,
    issueDate,
    description
  },
  "achievements": *[_type == "achievement" && featured == true] | order(order asc)[0...6]{
    title,
    type,
    issuer,
    date,
    description
  }
}`);

export type PortfolioContextData = {
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    headline?: string | null;
    shortBio?: string | null;
    fullBioText?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    availability?: string | null;
    yearsOfExperience?: number | null;
    socialLinks?: Record<string, string | undefined> | null;
  } | null;
  experience: Array<Record<string, unknown>> | null;
  projects: Array<Record<string, unknown>> | null;
  skills: Array<Record<string, unknown>> | null;
  education: Array<Record<string, unknown>> | null;
  certifications: Array<Record<string, unknown>> | null;
  achievements: Array<Record<string, unknown>> | null;
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available for hire",
  open: "Open to opportunities",
  unavailable: "Not looking",
};

function formatAvailability(value: string | null | undefined): string | null {
  if (!value) return null;
  return AVAILABILITY_LABELS[value] ?? value;
}

export function formatPortfolioContext(data: PortfolioContextData): string {
  const profile = data.profile;
  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ");

  const sections: string[] = [
    "# Portfolio owner profile",
    fullName ? `Name: ${fullName}` : null,
    profile?.headline ? `Headline: ${profile.headline}` : null,
    profile?.shortBio ? `Short bio: ${profile.shortBio}` : null,
    profile?.fullBioText ? `Full bio: ${profile.fullBioText}` : null,
    profile?.location ? `Location: ${profile.location}` : null,
    formatAvailability(profile?.availability ?? null)
      ? `Availability: ${formatAvailability(profile?.availability ?? null)}`
      : null,
    profile?.yearsOfExperience != null
      ? `Years of experience: ${profile.yearsOfExperience}`
      : null,
    profile?.email ? `Email: ${profile.email}` : null,
    profile?.phone ? `Phone: ${profile.phone}` : null,
    profile?.socialLinks
      ? `Social links: ${JSON.stringify(profile.socialLinks, null, 2)}`
      : null,
  ].filter(Boolean) as string[];

  if (data.experience?.length) {
    sections.push("\n# Work experience");
    for (const job of data.experience) {
      sections.push(JSON.stringify(job, null, 2));
    }
  }

  if (data.projects?.length) {
    sections.push("\n# Featured projects");
    for (const project of data.projects) {
      sections.push(JSON.stringify(project, null, 2));
    }
  }

  if (data.skills?.length) {
    sections.push("\n# Skills");
    for (const skill of data.skills) {
      sections.push(JSON.stringify(skill, null, 2));
    }
  }

  if (data.education?.length) {
    sections.push("\n# Education");
    for (const entry of data.education) {
      sections.push(JSON.stringify(entry, null, 2));
    }
  }

  if (data.certifications?.length) {
    sections.push("\n# Certifications");
    for (const cert of data.certifications) {
      sections.push(JSON.stringify(cert, null, 2));
    }
  }

  if (data.achievements?.length) {
    sections.push("\n# Achievements");
    for (const achievement of data.achievements) {
      sections.push(JSON.stringify(achievement, null, 2));
    }
  }

  return sections.join("\n");
}

let cachedContext: { text: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getPortfolioContextText(): Promise<string> {
  const now = Date.now();
  if (cachedContext && now - cachedContext.fetchedAt < CACHE_TTL_MS) {
    return cachedContext.text;
  }

  const data = await client.fetch<PortfolioContextData>(PORTFOLIO_CONTEXT_QUERY);
  const text = formatPortfolioContext(data);
  cachedContext = { text, fetchedAt: now };
  return text;
}
