import { defineQuery } from "next-sanity";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { sanityFetch } from "@/sanity/lib/live";

const HERO_QUERY = defineQuery(`*[_id == "singleton-profile"][0]{
    firstName,
    lastName,
    headline,
    headlineStaticText,
    headlineAnimatedWords,
    headlineAnimationDuration,
    shortBio,
    email,
    phone,
    location,
    availability,
    socialLinks,
    yearsOfExperience,
    profileImage
}`);

async function HeroSection() {
  const { data: profile } = await sanityFetch({ query: HERO_QUERY });

  if (!profile) {
    return null;
  }

  const fullName = [profile.firstName, profile.lastName]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const availabilityLabel =
    profile.availability === "available"
      ? "Available for projects"
      : profile.availability === "open"
        ? "Open to opportunities"
        : profile.availability === "unavailable"
          ? "Currently unavailable"
          : null;

  const socialLinks = profile.socialLinks
    ? Object.entries(profile.socialLinks).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0,
    )
    : [];

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      <BackgroundRippleEffect />

    </section>
  );
}

export default HeroSection;
