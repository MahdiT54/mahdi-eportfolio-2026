import { type SchemaTypeDefinition } from "sanity";
import project from "./project";
import experience from "./experience";
import profile from "./profile";
import skill from "./skill";
import education from "./education";
import testimonial from "./testimonial";
import certification from "./certification";
import achievement from "./achievement";
import blog from "./blog";
import service from "./service";
import contact from "./contact";
import siteSettings from "./siteSettings";
import navigation from "./navigation";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    profile,
    project,
    skill,
    experience,
    education,
    testimonial,
    certification,
    achievement,
    blog,
    service,
    contact,
    siteSettings,
    navigation,
  ],
};
