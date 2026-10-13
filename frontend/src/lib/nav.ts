// Връща безопасен вътрешен адрес от ?next=..., или null.
// Позволяваме само вътрешни пътища, за да няма пренасочване към чужд сайт.
export function safeNext(): string | null {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
