// One business record. The NAP phone is the only phone number on the site.
// Address: Josh, 2 Nov 2026. NAP (JSON-LD, llms.txt, map) is exactly the Google Business Profile.
// Visitors see the same address with "(Plainview Road at Campbell)", the name locals know.
// Phone, address and service area live in cityConfig.ts (Rule 0.4, Rule 7).

import { city } from "./cityConfig";

export const SITE_URL = "https://www.springfieldwarriorsports.com";

export const site = {
  name: "Springfield Warrior Sports",
  tagline: "Ninja and Parkour Gym",
  url: SITE_URL,
  phone: city.phone,
  email: "office@swarriorsports.com",
  address: city.address,
  hours: [
    { days: "Monday", opens: "12:00", closes: "18:00", text: "Monday: 12pm-6pm" },
    { days: "Tuesday", opens: "15:00", closes: "17:30", text: "Tuesday: 3pm-5:30pm" },
    { days: "Wednesday", opens: "12:00", closes: "17:30", text: "Wednesday: 12pm-5:30pm" },
    { days: "Thursday", opens: "15:00", closes: "18:00", text: "Thursday: 3pm-6pm" },
    { days: "Friday", opens: "12:00", closes: "18:00", text: "Friday: 12pm-6pm" },
    { days: "Saturday", opens: "14:00", closes: "18:00", text: "Saturday: 2pm-6pm" },
  ],
  sundayNote: "Sunday: Private Parties and Group Events by Appointment",
  preschoolNote: "Preschool hours: Tuesday mornings from 9:30am-11:30am",
  waiver: "https://waiver.smartwaiver.com/w/573a0ba38a114/web/",
  facebook: "https://www.facebook.com/springfieldwarriorsports/",
  instagram: "https://www.instagram.com/springfield_warrior_sports/",
  ga4: "G-DLZRG9QF8J",
} as const;

export const utilityNav = [
  { label: "Contact", path: "/contact/" },
  { label: "About", path: "/about/" },
  { label: "Sign Our Waiver", path: site.waiver, external: true },
] as const;

export const mainNav = [
  { label: "Adult Classes", path: "/fitness-classes/" },
  { label: "Kid Classes", path: "/kids-classes/" },
  { label: "Competitions", path: "/competitions/" },
  { label: "Birthday Parties", path: "/birthday-parties/" },
  { label: "Personal Training", path: "/personal-training/" },
  { label: "Summer Camps", path: "/summer-camps-in-springfield-mo/" },
] as const;

/** Header quick links (Rule 5): the four main reasons people come in. */
export const quickNav = [
  { label: "Kid Classes", path: "/kids-classes/" },
  { label: "Adult Classes", path: "/fitness-classes/" },
  { label: "Birthday Parties", path: "/birthday-parties/" },
  { label: "Summer Camps", path: "/summer-camps-in-springfield-mo/" },
] as const;

export const footerClasses = [
  { label: "Kid Classes", path: "/kids-classes/" },
  { label: "Adult Classes", path: "/fitness-classes/" },
  { label: "Parkour", path: "/parkour/" },
  { label: "Homeschool Classes", path: "/homeschool-sports-and-classes-springfield-mo/" },
  { label: "Personal Training", path: "/personal-training/" },
  { label: "Summer Camps", path: "/summer-camps-in-springfield-mo/" },
] as const;

export const footerEvents = [
  { label: "Birthday Parties", path: "/birthday-parties/" },
  { label: "Laser Tag", path: "/laser-tag/" },
  { label: "Nerf Wars", path: "/nerf-wars/" },
  { label: "Competitions", path: "/competitions/" },
  { label: "WNL Competitions", path: "/wnl-competitions/" },
] as const;

export const headerNav = [...utilityNav, ...mainNav] as const;

export const footerLinks = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about/" },
  { label: "Contact Us", path: "/contact/" },
  { label: "Meet the Team", path: "/meet-the-team/" },
] as const;

export const stickyBar = {
  callLabel: "Call",
  bookLabel: "Book a Party",
  bookPath: "/schedule-birthday-party/",
  formAnchor: "#party-form",
} as const;
