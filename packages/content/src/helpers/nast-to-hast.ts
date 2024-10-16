// import { Transformer } from "unified";
// import { Element } from "hast";

// import { Content, Root } from "../nast/types.js";

// function transformNode(node: Content): Element {
//   switch (node.type) {
//     case "link":
//       return {
//         type: "element",
//         tagName: "a",
//         properties: { href: node.href },
//         children: [{ type: "text", value: node.value }],
//       };
//     case "mention":
//       return {
//         type: "element",
//         tagName: "a",
//         properties: { href: node.encoded },
//         children: [{ type: "text", value: node.encoded }],
//       };
//     case "text":
//       return { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: node.value }] };
//     case "cashu":
//       return {
//         type: "element",
//         tagName: "a",
//         properties: { href: "cashu:" + node.token },
//         children: [{ type: "text", value: node.token }],
//       };
//     case "lightning":
//       return {
//         type: "element",
//         tagName: "a",
//         properties: { href: "lightning:" + node.invoice },
//         children: [{ type: "text", value: node.invoice }],
//       }
//   }
// }

// export function nastToHast(): Transformer<Root, Element> {
//   return (tree) => {
//     return {
//       type: "element",
//       tagName: "div",
//       properties: {},
//       children: tree.children.map(transformNode),
//     };
//   };
// }
