import katex from "katex"

export default function M({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: false }) }} />
}
