import {useEffect, useState, type ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import UpdateBanner from "@/components/UpdateBanner";
import OfflineBanner from "@/components/OfflineBanner";
import PwaInstallTracker from "@/components/PwaInstallTracker";
import NotFound from "@/pages/NotFound";
import {JSON_LD, METRIKA_SCRIPT, THEME_INIT_SCRIPT} from "@/config/seo";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";

const TITLE = "короткий-номер.рф — справочник коротких телефонных номеров";
const DESCRIPTION = "Короткий номер телефона. Найдите чужой или получите свой.";
const OG_IMAGE = "https://cdn.poehali.dev/projects/***/files/og-image-1784402519956.png";
const FAVICON = "https://cdn.poehali.dev/projects/***/files/favicon-1776241739591.jpg";
const SITE_URL = "https://xn----8sba3afbebm8bqk.xn--p1ai/";

const SPLASHES: [string, string][] = [
    ["2048-2732", "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"],
    ["1668-2388", "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"],
    ["1536-2048", "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"],
    ["1290-2796", "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"],
    ["1284-2778", "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"],
    ["1179-2556", "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"],
    ["1170-2532", "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"],
    ["1125-2436", "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"],
    ["1242-2688", "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"],
    ["828-1792", "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"],
    ["1242-2208", "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"],
    ["750-1334", "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"],
    ["640-1136", "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"],
];

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=5.0"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {name: "author", content: "korotkiy-nomer.rf"},
            {
                name: "keywords",
                content: "короткие номера, телефоны экстренных служб, 112, 101, 102, 103, поддержка МТС, Билайн, МегаФон, Т2, справочник телефонов России, короткий номер, 2407",
            },
            {name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"},
            {name: "mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-status-bar-style", content: "default"},
            {name: "apple-mobile-web-app-title", content: "Справочник «2407.рф»"},
            {property: "og:type", content: "website"},
            {property: "og:url", content: SITE_URL},
            {property: "og:locale", content: "ru_RU"},
            {property: "og:site_name", content: "КОРОТКИЙ-НОМЕР.РФ"},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: DESCRIPTION},
            {property: "og:image:width", content: "4800"},
            {property: "og:image:height", content: "2520"},
            {property: "og:image:alt", content: "КОРОТКИЙ-НОМЕР.РФ — справочник коротких телефонных номеров России"},
            {property: "og:image", content: OG_IMAGE},
            {name: "twitter:card", content: "summary_large_image"},
            {name: "twitter:title", content: "КОРОТКИЙ-НОМЕР.РФ — справочник коротких номеров"},
            {
                name: "twitter:description",
                content: "Все короткие номера России: 112, 101, 102, 103, поддержка операторов, банки. Проверено вручную.",
            },
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "canonical", href: SITE_URL},
            {rel: "alternate", hrefLang: "ru", href: SITE_URL},
            {rel: "alternate", hrefLang: "ru", href: "https://2407.xn--p1ai/"},
            {rel: "alternate", hrefLang: "x-default", href: SITE_URL},
            {rel: "llms", href: "/llms.txt", type: "text/plain"},
            {rel: "llms-full", href: "/llms-full.txt", type: "text/plain"},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap",
            },
            {rel: "icon", type: "image/jpeg", href: FAVICON},
            {rel: "shortcut icon", type: "image/jpeg", href: FAVICON},
            {rel: "manifest", href: "/manifest.json"},
            {rel: "apple-touch-icon", href: "https://cdn.poehali.dev/files/38eb13e3-1c31-48b5-8e01-7cb7f13c0bad.png"},
            ...SPLASHES.map(([size, media]) => ({
                rel: "apple-touch-startup-image",
                href: `/splash/apple-splash-${size}.png`,
                media,
            })),
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {children: THEME_INIT_SCRIPT},
            ...JSON_LD.map((data) => ({type: "application/ld+json", children: JSON.stringify(data)})),
            {children: METRIKA_SCRIPT},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    const [queryClient] = useState(() => new QueryClient());

    useEffect(() => {
        const isIframe = window.self !== window.top;
        if (!("serviceWorker" in navigator) || isIframe) return;
        const register = () => {
            navigator.serviceWorker.register("/sw.js").then((reg) => {
                const sw = reg.installing || reg.waiting || reg.active;
                if (sw) {
                    const assets = performance.getEntriesByType("resource")
                        .map((e) => new URL((e as PerformanceResourceTiming).name).pathname)
                        .filter((p) => p.endsWith(".js") || p.endsWith(".css"));
                    sw.postMessage({type: "PRECACHE_ASSETS", assets});
                }
            }).catch(() => {});
        };
        if (document.readyState === "complete") register();
        else {
            window.addEventListener("load", register);
            return () => window.removeEventListener("load", register);
        }
    }, []);

    return (
        <RootDocument>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster/>
                    <Sonner/>
                    <OfflineBanner/>
                    <UpdateBanner/>
                    <PwaInstallTracker/>
                    <Outlet/>
                </TooltipProvider>
            </QueryClientProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <noscript>
            <div><img src="https://mc.yandex.ru/watch/101026698" style={{position: "absolute", left: "-9999px"}} alt=""/></div>
            <div><img src="https://mc.yandex.ru/watch/103323875" style={{position: "absolute", left: "-9999px"}} alt=""/></div>
        </noscript>
        <Scripts/>
        </body>
        </html>
    );
}
