import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "applesauce",
  description: "Utilities for nostr apps",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "https://hzrd149.github.io/applesauce/examples" },
      { text: "Reference", link: "https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_core.html" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Why applesauce", link: "/introduction/why-applesauce" },
          { text: "Getting Started", link: "/introduction/getting-started" },
          { text: "Packages", link: "/introduction/packages" },
        ],
      },
      {
        text: "Overview",
        items: [
          { text: "Events", link: "/overview/events" },
          { text: "Queries", link: "/overview/queries" },
          { text: "Helpers", link: "/overview/helpers" },
          { text: "Event Factory", link: "/overview/factory" },
          { text: "Loaders", link: "/overview/loaders" },
        ],
      },
      {
        text: "Accounts",
        items: [
          { text: "Accounts", link: "/accounts/accounts" },
          { text: "Manager", link: "/accounts/manager" },
        ],
      },
      {
        text: "Social",
        items: [
          { text: "Notes", link: "/social/notes" },
          { text: "Comments", link: "/social/comments" },
          { text: "Reactions", link: "/social/reactions" },
          { text: "Timelines", link: "/social/timelines" },
        ],
      },
      {
        text: "React",
        items: [
          { text: "Getting Started", link: "/react/getting-started" },
          { text: "Providers", link: "/react/providers" },
          { text: "Hooks", link: "/react/hooks" },
        ],
      },
      {
        text: "Signers",
        items: [
          { text: "Signers", link: "/signers/signers" },
          { text: "Nostr Connect", link: "/signers/nostr-connect" },
        ],
      },
      {
        text: "Content",
        items: [
          { text: "Text", link: "/content/text" },
          { text: "Markdown", link: "/content/markdown" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/hzrd149/applesauce" }],
  },
});
