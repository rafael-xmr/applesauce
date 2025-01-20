import { useState } from "react";
import { Drawer, List, ListItem, ListItemText, TextField, Box, ListItemButton, Toolbar } from "@mui/material";
import examples from "./examples";

export default function SideNav() {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filtered = examples.filter((item) => item.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Drawer
      sx={{
        width: 300,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 300,
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
        />
      </Box>
      <Box sx={{ overflow: "auto" }}>
        <List>
          {filtered.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton href={"#" + item.id}>
                <ListItemText primary={item.id} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
