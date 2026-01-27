import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "onlyoffice-demo-mode",

  initialize(container) {
    const siteSettings = container.lookup("service:site-settings");

    if (!siteSettings.onlyoffice_connector_enabled) {
      return;
    }

    withPluginApi("0.8", (api) => {
      let demoInfoCache = null;

      const applyDemoModeStyles = async () => {
        try {
          if (!demoInfoCache) {
            const response = await ajax("/onlyoffice/demo-info");
            demoInfoCache = response;
          }

          const demoEnabled = demoInfoCache.enabled;
          const demoAvailable = demoInfoCache.available;
          const daysRemaining = demoInfoCache.days_remaining;
          const expirationDate = demoInfoCache.expiration_date;

          // Disable settings fields when demo is enabled
          const settingsToDisable = [
            "ONLYOFFICE_Docs_address",
            "ONLYOFFICE_Docs_secret_key",
            "JWT_header",
          ];

          settingsToDisable.forEach((settingName) => {
            const settingRow = document.querySelector(
              `[data-setting="${settingName}"]`
            );

            if (settingRow) {
              const input = settingRow.querySelector("input");

              // Lock fields if demo is enabled
              if (input && demoEnabled) {
                // Make field readonly instead of disabled
                input.readOnly = true;
                input.style.opacity = "0.6";
                input.style.cursor = "not-allowed";
                input.style.backgroundColor = "#f5f5f5";
                input.style.pointerEvents = "none";

                // Hide secret
                if (settingName === "ONLYOFFICE_Docs_secret_key") {
                  if (!input.dataset.originalValue) {
                    input.dataset.originalValue = input.value;
                  }
                  input.type = "password";
                  input.value = input.dataset.originalValue || input.value;
                }
              } else if (input) {
                input.readOnly = false;
                input.style.opacity = "1";
                input.style.cursor = "text";
                input.style.backgroundColor = "";
                input.style.pointerEvents = "";

                // Restore secret
                if (settingName === "ONLYOFFICE_Docs_secret_key") {
                  input.type = "text";
                  if (input.dataset.originalValue) {
                    input.value = input.dataset.originalValue;
                    delete input.dataset.originalValue;
                  }
                }
              }
            }
          });

          // Handle demo checkbox
          const demoCheckboxRow = document.querySelector(
            '[data-setting="Connect_to_demo_ONLYOFFICE_Docs_server"]'
          );
          if (demoCheckboxRow) {
            const checkbox = demoCheckboxRow.querySelector(
              'input[type="checkbox"]'
            );

            const label = demoCheckboxRow.querySelector(".setting-label") ||
                         demoCheckboxRow.querySelector("label");

            // Remove old messages
            if (label) {
              const oldMessage = label.querySelector(".demo-message");
              if (oldMessage) {
                oldMessage.remove();
              }
            }

            // Logic for expired demo mode
            if (!demoAvailable) {
              //  Disable checkbox if expired and not enabled
              if (!demoEnabled && checkbox) {
                checkbox.disabled = true;
              }
              // Allow to disable it if expired and enabled
              else if (demoEnabled && checkbox) {
                checkbox.disabled = false;
              }

              // Show expired message
              if (label) {
                const message = document.createElement("div");
                message.className = "demo-message";
                message.style.color = "#e74c3c";
                message.style.marginTop = "8px";
                message.style.fontSize = "13px";
                message.textContent = "The 30-day test period is over. You are no longer able to connect to the demo server.";
                label.appendChild(message);
              }
            }
            // Demo mode is active and enabled
            else if (demoEnabled && expirationDate) {
              const formattedDate = new Date(expirationDate).toLocaleDateString();

              if (label) {
                const message = document.createElement("div");
                message.className = "demo-message";
                message.style.color = "#3498db";
                message.style.marginTop = "8px";
                message.style.fontSize = "13px";
                message.textContent = `You are successfully connected to the demo server. It will be available until ${formattedDate}. To disable it, uncheck the box.`;
                label.appendChild(message);
              }
            }

            // Watch for demo mode changes (save and reload)
            if (checkbox && !checkbox.dataset.demoListenerAdded) {
              checkbox.dataset.demoListenerAdded = "true";

              // Mark checkbox as changed when user toggles it
              checkbox.addEventListener("change", async () => {
                checkbox.dataset.wasChanged = "true";
                demoInfoCache = null; // Clear cache

                // Find the OK button and emulated click to save
                const okButton = demoCheckboxRow.querySelector(".setting-controls__ok");
                if (okButton) {
                  okButton.click();

                  // Wait for save
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } else {
                  // Reload after delay
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              });
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to load demo info:", error);
        }
      };

      const checkAndApply = () => {
        if (window.location.pathname.includes("/admin/site_settings") ||
            window.location.pathname.includes("/admin")) {
          setTimeout(() => applyDemoModeStyles(), 100);
          setTimeout(() => applyDemoModeStyles(), 500);
          setTimeout(() => applyDemoModeStyles(), 1000);
          setTimeout(() => applyDemoModeStyles(), 2000);
        }
      };

      // Apply on page change
      api.onPageChange(checkAndApply);

      // Apply if already on settings page
      checkAndApply();

      setTimeout(() => {
        if (window.location.pathname.includes("/admin/site_settings")) {
          const observer = new MutationObserver(() => {
            applyDemoModeStyles();
          });

          const settingsContainer = document.querySelector(".admin-contents");
          if (settingsContainer) {
            observer.observe(settingsContainer, {
              childList: true,
              subtree: true,
            });
          }
        }
      }, 500);
    });
  },
};
