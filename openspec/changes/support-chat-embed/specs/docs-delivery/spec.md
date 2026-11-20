## MODIFIED Requirements

### Requirement: The server sends safe headers

The production server SHALL send `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and a `Content-Security-Policy` that allows only
the site's own scripts, styles, images and fonts, plus the support chat's origin in `script-src`
and `frame-src` when the build configured the support chat, and SHALL serve `.md` as
`text/markdown; charset=utf-8` and `.txt` as `text/plain; charset=utf-8`. Unknown paths SHALL
return the site's `404` page with status 404. The policy SHALL be written by the build
(`dist/_csp.caddy`) and served as written.

#### Scenario: Headers are present

- **WHEN** the smoke test requests `/`
- **THEN** each listed header is present, and the `Content-Security-Policy` is the one in
  `_csp.caddy`

#### Scenario: Unknown paths are 404

- **WHEN** the smoke test requests `/no-such-page/`
- **THEN** the status is 404 and the body is the site's 404 page

## ADDED Requirements

### Requirement: The support chat embed is off unless configured

The site SHALL render the support chat tag, `<script src="<PUBLIC_SUPPORT_CHAT_URL>/v1/widget.js"
data-key="<PUBLIC_SUPPORT_CHAT_KEY>" async>`, on every page only when both build settings are
set, and no chat tag otherwise. Setting only one, an origin that is not `https` (or
`http://localhost`) or has a path, or a key that is not `lpk_` and 26 lower-case base32
characters SHALL fail the build.

#### Scenario: Off by default

- **WHEN** `just check` builds the site without the settings
- **THEN** `check-site` finds no chat tag on any page and the policy names no other origin

#### Scenario: Configured

- **WHEN** a page in a configured build is checked
- **THEN** it has exactly one chat tag with the configured URL and key, loaded async, and
  `_csp.caddy` adds the chat origin to `script-src` and `frame-src` only

#### Scenario: Half configured

- **WHEN** only `PUBLIC_SUPPORT_CHAT_KEY` is set
- **THEN** the build fails naming both settings
