import { parseBBCodeTag } from "pretty-text/engines/discourse-markdown/bbcode-block";

function addOnlyofficeLink(buffer, matches, state) {
  const parsed = parseBBCodeTag(matches[0], 0, matches[0].length, false);
  const token = new state.Token("iframe_open", "iframe", 1);

  token.attrs = Object.entries(parsed.attrs);
  token.attrs.push(["class", "onlyoffice-doc-block"]);
  token.attrs.push([
    "src",
    `/onlyoffice/editor/${parsed.attrs.docid}${parsed.attrs["view"] ? "?view=1" : ""}`,
  ]);

  buffer.push(token);
  buffer.push(new state.Token("iframe_close", "iframe", -1));
}

export function setup(helper) {
  helper.allowList([
    "iframe.onlyoffice-doc-block",
    "iframe[docid]",
    "iframe[src]",
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
