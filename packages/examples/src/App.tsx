import { useEffect, useState } from "react";
import { AppBar, Box, Button, CssBaseline, Link, Stack, Toolbar, Typography } from "@mui/material";

import SideNav from "./Nav";
import examples from "./examples";

function App() {
  const [source, setSource] = useState("");
  const [Example, setExample] = useState<(() => JSX.Element) | null>();

  // load selected example
  useEffect(() => {
    const listener = () => {
      const name = location.hash.replace(/^#/, "");
      const example = examples.find((e) => e.id === name);
      if (example) {
        setSource(example.path.replace(/^\.\//, ""));
        example.load().then((module: any) => {
          console.log("loaded", module.default);
          setExample(() => module.default);
        });
      }
    };

    listener();
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Examples
          </Typography>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Button sx={{ color: "#fff" }} href="https://hzrd149.github.io/applesauce">
              Documentation
            </Button>
            <Button sx={{ color: "#fff" }} href="https://hzrd149.github.io/applesauce/typedoc/">
              Reference
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <SideNav />

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default" }}>
        <Toolbar />
        {Example ? (
          <Stack direction="column">
            <Stack sx={{ p: 1 }}>
              <Link
                target="_blank"
                href={`https://github.com/hzrd149/applesauce/tree/master/packages/examples/src/${source}`}
              >
                source code
              </Link>
            </Stack>
            <Box sx={{ flex: 1 }}>
              <Example />
            </Box>
          </Stack>
        ) : (
          "Select example"
        )}
      </Box>
    </Box>
  );
}

export default App;
