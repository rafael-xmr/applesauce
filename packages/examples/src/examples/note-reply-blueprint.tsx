import { useState } from "react";
import { useAsync } from "react-use";
import { Container, Typography } from "@mui/material";
import { EventFactory } from "applesauce-factory";
import JsonBlock from "../components/json-block";

const factory = new EventFactory();

const parent = {
  content: "Nostr is a new programming language.",
  created_at: 1737334002,
  id: "efb83177e63bffb73ad6a39b09f10e693bb2c569e90aa7e17a2294feb7a75632",
  kind: 1,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  sig: "3d7a5958e6a4750a61df5c1d4dd4b9ffd272fc2912d22d56e1e4cd2c242cfdeb83ce8cbcd052817c1c240e93bc90b5e67b2dee5dc169ec14117636625565c4d9",
  tags: [],
};

export default function NoteReplyBlueprintExample() {
  const [input, setInput] = useState<string>("");
  const { value: output } = useAsync(() => factory.noteReply(parent, input), [input]);

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Note Reply blueprint
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

      <Typography variant="h6" gutterBottom>
        Parent event
      </Typography>
      <JsonBlock value={parent} />
    </Container>
  );
}
