import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";
import OnlyofficeActionsModal from "../components/modal/onlyoffice-actions-modal";

let formatsMap = null;

async function loadFormats() {
  if (formatsMap) {
    return formatsMap;
  }

  try {
    const response = await ajax("/onlyoffice/formats");
    formatsMap = new Map();

    const formats = Array.isArray(response) ? response : response.formats || [];
    formats.forEach((format) =>
      formatsMap.set(format.name.toLowerCase(), format),
    );

    window.onlyofficeFormatsMap = formatsMap;
    return formatsMap;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load formats:", error);
    formatsMap = new Map();
    return formatsMap;
  }
}

function getFormatInfo(extension) {
  return formatsMap?.get(extension.toLowerCase());
}

function extractUploadInfo(attachmentLink) {
  const href = attachmentLink.getAttribute("href");
  const dataOrigHref = attachmentLink.getAttribute("data-orig-href");
  const filename = attachmentLink.textContent.trim();
  const extension = filename.split(".").pop();

  let shortUrl = dataOrigHref || href;

  if (shortUrl.includes("/uploads/short-url/")) {
    shortUrl = shortUrl.split("/uploads/short-url/")[1];
  } else if (shortUrl.includes("upload://")) {
    shortUrl = shortUrl.split("upload://")[1];
  }

  shortUrl = shortUrl.replace(/^upload:\/\//, "");

  // Remove file extension from short URL if present
  const extensionPattern = new RegExp(`\.${extension}$`, "i");
  shortUrl = shortUrl.replace(extensionPattern, "");

  return {
    filename,
    extension,
    uploadUrl: href,
    uploadShortUrl: shortUrl,
    uploadShortUrlFull: `upload://${shortUrl}`,
  };
}

export default {
  name: "onlyoffice-attachment-handler",

  initialize(container) {
    const siteSettings = container.lookup("service:site-settings");

    if (!siteSettings.onlyoffice_connector_enabled) {
      return;
    }

    withPluginApi(async () => {
      await loadFormats();

      const handleAttachmentClick = async (event) => {
        const target = event.target.closest("a.attachment");
        if (!target || !formatsMap) {
          return;
        }

        // Skip if attachment is in composer (unsent message)
        const isInComposer = target.closest(
          "#reply-control, .d-editor-preview",
        );
        if (isInComposer) {
          return;
        }

        const uploadInfo = extractUploadInfo(target);
        const formatInfo = getFormatInfo(uploadInfo.extension);

        if (!formatInfo) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        // Get post info from the post element
        const postElement = target.closest("article[data-post-id]");
        const postUserId = postElement
          ? parseInt(postElement.getAttribute("data-user-id"), 10)
          : null;
        const postId = postElement
          ? parseInt(postElement.getAttribute("data-post-id"), 10)
          : null;

        try {
          const response = await ajax(
            `/onlyoffice/upload-info/${uploadInfo.uploadShortUrl}`,
          );
          container.lookup("service:modal").show(OnlyofficeActionsModal, {
            model: {
              ...uploadInfo,
              formatInfo,
              uploadId: response.upload_id,
              uploadUserId: response.user_id,
              postUserId,
              postId,
            },
          });
        } catch {
          // If upload-info fails, use post author as fallback
          container.lookup("service:modal").show(OnlyofficeActionsModal, {
            model: { ...uploadInfo, formatInfo, postUserId, postId },
          });
        }
      };

      document.addEventListener("click", handleAttachmentClick, true);
    });
  },
};
