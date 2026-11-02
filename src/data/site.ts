// One business record. The NAP phone is the only phone number on the site.
// Footer address and contact-page address are both on the live site (Farm Road 182 is Plainview Road).

export const SITE_URL = "https://www.springfieldwarriorsports.com";

export const site = {
  name: "Springfield Warrior Sports",
  tagline: "Ninja and Parkour Gym",
  url: SITE_URL,
  phone: {
    display: "(417) 894-7319",
    tel: "tel:+14178947319",
    e164: "+14178947319",
  },
  email: "office@swarriorsports.com",
  address: {
    street: "605 W. Plainview Road",
    footer: "605 W Farm Rd 182, Springfield, MO, 65810, United States",
    city: "Springfield",
    region: "MO",
    postalCode: "65810",
    country: "US",
    oneLine: "605 W. Plainview Road, Springfield, MO 65810",
  },
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
