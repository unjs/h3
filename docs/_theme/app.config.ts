export default defineAppConfig({
  ui: {
    primary: "theme",
    gray: "zinc",
    footer: {
      bottom: {
        left: "text-sm text-gray-500 dark:text-gray-400",
        wrapper: "border-t border-gray-200 dark:border-gray-800",
      },
    },
  },
  seo: {
    siteName: "Unjs/H3 Documentation",
  },
  header: {
    logo: {
      alt: "",
      light: "",
      dark: "",
    },
    search: true,
    colorMode: true,
    links: [
      {
        icon: "i-simple-icons-github",
        to: "https://github.com/unjs/h3",
        target: "_blank",
        "aria-label": "UnJS/H3 on GitHub",
      },
    ],
  },
  footer: {
    credits: "Released under the MIT License.",
    links: [
      {
        icon: "i-simple-icons-x",
        to: "https://x.com/unjsio",
        target: "_blank",
        "aria-label": "Follow UnJS on X",
      },
      {
        icon: "i-simple-icons-github",
        to: "https://github.com/unjs/h3",
        target: "_blank",
        "aria-label": "H3 on GitHub",
      },
    ],
  },
});
