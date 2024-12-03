import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "applesauce",
  description: "Utilities for nostr apps",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Reference", link: "/typedoc/modules/applesauce_core.html" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Why applesauce", link: "/introduction/why-applesauce" },
          { text: "Installation", link: "/introduction/installation" },
          { text: "Getting Started", link: "/introduction/getting-started" },
        ],
      },
      {
        text: "Signers",
        items: [
          { text: "Installation", link: "/signers/installation" },
          { text: "Password Signer", link: "/signers/password-signer" },
        ],
      },
      {
        text: "Lists",
        items: [{ text: "Installation", link: "/lists/installation" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }],
  },
});
