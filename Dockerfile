# The docs.getlooma.io image (openspec change docs-site, design.md D13): Caddy serving the site
# built by `just build` (CI builds dist/ in the Nix shell first; this file only packages it).
# An exception to the no-Dockerfile convention of the service repositories, approved by the owner.
FROM caddy:2.11.7-alpine@sha256:e70b164da81ef698b3ad19af799ea6086ce6d9e48ed4079eb9fe26f6fbf14ee5

RUN adduser -D -H -u 10001 web && mkdir -p /data /config && chown -R web /data /config
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --chown=web dist/ /srv/

ENV PORT=8080 SITE_ROOT=/srv
USER web
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
