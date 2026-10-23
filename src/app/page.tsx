import { permanentRedirect } from "next/navigation";

export default function Home() {
  return permanentRedirect("/dashboard", "replace");
}
