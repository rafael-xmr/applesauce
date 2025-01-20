import { useState } from "react";
import { useAsync } from "react-use";
import { Container, Typography } from "@mui/material";
import { EventFactory } from "applesauce-factory";
import JsonBlock from "../components/json-block";

const factory = new EventFactory();

export default function NoteBlueprintExample() {
  const [input, setInput] = useState<string>("");
  const { value: output } = useAsync(() => factory.note(input), [input]);

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        NoteBlueprint
      </Typography>

      <textarea
        rows={6}
        cols={120}
        placeholder="Enter text here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <Typography variant="h6" gutterBottom>
        Event template
      </Typography>
      {output && <JsonBlock value={output} />}
    </Container>
  );
}
