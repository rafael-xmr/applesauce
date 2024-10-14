import React from "react";
import { Content, ContentMap, Root } from "applesauce-content/nast";

type Component<ComponentProps> = React.FunctionComponent<ComponentProps> | React.ComponentClass;

export type ExtraProps<T extends Content> = { node: T };
export type ComponentMap = Partial<{
  [k in keyof ContentMap]: Component<ExtraProps<ContentMap[k]>>;
}>;

export function renderNast(root: Root, components: ComponentMap) {
  const indexes: Record<string, number> = {};
  return (
    <>
      {root.children.map((node) => {
        indexes[node.type] = indexes[node.type] ?? 0;
        const index = indexes[node.type];
        indexes[node.type]++;

        const Component = components[node.type];
        if (!Component) return null;
        // @ts-expect-error
        return <Component key={node.type + "-" + index} node={node} />;
      })}
    </>
  );
}
