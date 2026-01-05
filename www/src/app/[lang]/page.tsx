import { getDictionary } from "@/lib/get-dictionary";
import HomeClient from "./HomeClient";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as any);

  return <HomeClient dict={dict} lang={lang} />;
}
