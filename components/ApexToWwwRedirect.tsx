import { APEX_PUBLIC_HOST, getSiteUrl } from "@/lib/site-legal";

/**
 * Мгновенный переход apex → www в браузере (до гидрации).
 * Подстраховка для мобильных сетей, если цепочка редиректов на прокси/nginx ведёт себя иначе, чем на десктопе.
 * Инлайн-скрипт вместо next/script beforeInteractive (в App Router это не рекомендуется).
 */
export default function ApexToWwwRedirect() {
  const origin = getSiteUrl().replace(/\/+$/, "");
  const inline = `
(function(){
  try {
    var h = document.location.hostname;
    if (h === ${JSON.stringify(APEX_PUBLIC_HOST)}) {
      var u = ${JSON.stringify(origin)} + (document.location.pathname || "/") + (document.location.search || "") + (document.location.hash || "");
      if (document.location.href !== u) document.location.replace(u);
    }
  } catch (e) {}
})();
`;

  return <script id="apex-to-www-fallback" dangerouslySetInnerHTML={{ __html: inline }} />;
}
