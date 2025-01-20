import { Paper } from "@mui/material";

export default function JsonBlock({ value }: { value: any }) {
  return (
    <Paper sx={{ overflow: "auto", px: 2, py: 0 }}>
      <pre>
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </Paper>
  );
}
