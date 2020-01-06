function parseHostname(url) {
    return (new URL(url)).hostname.toLowerCase();
}

export {parseHostname};