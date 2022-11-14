import { parseBBCodeTag } from "pretty-text/engines/discourse-markdown/bbcode-block";

function addOnlyofficeLink(buffer, matches, state) {
  let token = new state.Token("iframe_open", "iframe", 1);

  let parsed = parseBBCodeTag(matches[0], 0, matches[0].length, false);

  token.attrs = [];

  for (var key in parsed.attrs) {
    token.attrs.push([key, parsed.attrs[key]]);
  }

  token.attrs.push(["class", "onlyoffice-doc-block"]);

  buffer.push(token);

  closeBuffer(buffer, state);
}

function closeBuffer(buffer, state) {
  let token = new state.Token("iframe_close", "iframe", -1);

  buffer.push(token);
}

export function setup(helper) {
  helper.allowList([
    "iframe.onlyoffice-doc-block",
    "iframe[docid]",
    "iframe[style]",
    "iframe[view]",
  ]);

  helper.registerOptions((opts, siteSettings) => {
    opts.features["onlyoffice-doc-blocks"] =
      !!siteSettings.onlyoffice_connector_enabled;
  });

  helper.registerPlugin((md) => {
    const rule = {
      matcher: /\[onlyoffice(.+?)\]/,
      onMatch: addOnlyofficeLink,
    };

    md.core.textPostProcess.ruler.push("onlyoffice-doc-blocks", rule);
  });
}
