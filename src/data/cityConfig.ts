// One location. Springfield Warrior Sports is a single-location venue (Rule 0.4):
// no city switcher. The NAP phone is the only phone number on the site.

export const city = {
  slug: "springfield",
  name: "Springfield",
  state: "MO",
  displayName: "Springfield, MO",
  showInSwitcher: false,
  phone: {
    display: "(417) 894-7319",
    tel: "tel:+14178947319",
    e164: "+14178947319",
  },
  serviceArea: ["Springfield, MO"],
  address: {
    street: "605 W Farm Rd 182",
    display: "605 W Farm Rd 182 (Plainview Road at Campbell), Springfield, MO 65810",
    city: "Springfield",
    region: "MO",
    postalCode: "65810",
    country: "US",
    oneLine: "605 W Farm Rd 182, Springfield, MO 65810",
  },
} as const;
