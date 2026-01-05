import { getDictionary } from "@/lib/get-dictionary";
import SessionClient from "./SessionClient";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as any);

  return <SessionClient dict={dict} lang={lang} sessionId={id} />;
}
