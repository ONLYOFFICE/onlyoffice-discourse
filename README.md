# ONLYOFFICE plugin for Discourse

Welcome to the official repository for the **ONLYOFFICE plugin for Discourse**! It brings the power of [ONLYOFFICE Docs](https://www.onlyoffice.com/docs) right to your [Discourse](https://www.discourse.org/) enabling work with office files in topics and replies.

## Features ✨

The plugin allows Discourse users to:

* ✍️ Create and edit [text documents](https://www.onlyoffice.com/word-processor), [spreadsheets](https://www.onlyoffice.com/sheets), [presentations](https://www.onlyoffice.com/slides), and [PDFs](https://www.onlyoffice.com/pdf-editor) right inside Discourse.
* 👥 Collaborate on documents in real time.
* 📂 Convert and download files.
* 🔒 Manage file access permissions.

## Running ONLYOFFICE Docs

You'll need an instance of [ONLYOFFICE Docs](https://www.onlyoffice.com/docs).

### ☁️ Option 1: ONLYOFFICE Docs Cloud
No installation needed — just [register here](https://www.onlyoffice.com/docs-registration) and get instant access.
Your registration email includes all required connection details, including the **Document Server address** and **JWT credentials**.

### 🏠 Option 2: Self-hosted ONLYOFFICE Docs
Install ONLYOFFICE Docs on your own infrastructure for full control.
You have two main choices for the ONLYOFFICE Document Server:

* **Community Edition (Free)**: Ideal for small teams and personal use.
  * The **recommended** installation method is [Docker](https://github.com/onlyoffice/Docker-DocumentServer).
  * To install it on Debian, Ubuntu, or other derivatives, click [here](https://helpcenter.onlyoffice.com/docs/installation/docs-community-install-ubuntu.aspx).
* **Enterprise Edition**: Provides scalability for larger organizations. To install, click [here](https://helpcenter.onlyoffice.com/docs/installation/enterprise).

Community Edition vs Enterprise Edition comparison can be found [here](#onlyoffice-docs-editions).

## Plugin configuration ⚙️

Navigate to the **Admin** section in the left panel. On the page that opens, locate the **Plugins** section in the left panel and click on **Installed plugins**. From the list, find **ONLYOFFICE Discourse** and click **Settings**.

Enter the following details:

- **ONLYOFFICE Docs address**: The URL of your Docs instance (cloud or on-premises).
- **ONLYOFFICE Docs secret key**: Enables secure token-based access to documents. [Learn more](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/)
- **JWT Header**: If you have custom header naming in your Docs setup, enter it here.

To ensure the ONLYOFFICE plugin functions properly, enable the **Auto authorize extensions** setting. By default, Discourse limits the list of allowed attachment formats. Enabling this setting automatically expands the list of authorized extensions in Discourse, allowing users to attach and open files in the editor via the ONLYOFFICE plugin.

## Plugin usage 

### Creating and editing files ✍️

When adding a topic or comment, you can create a file (DOCX, XLSX, PPTX, or PDF) by clicking the ONLYOFFICE icon and selecting the desired format.

The created file is automatically attached to the topic or reply. Once published, the file appears in the post, and clicking its name opens a pop-up with the following actions:

- **Edit with ONLYOFFICE:** Open the file in ONLYOFFICE editors for seamless editing. The file creator is granted editing rights by default.
- **Download:** Save the file directly to your device.
- **Manage Permissions:** Adjust access rights for the file.
- **Convert:** Convert the file into a different format of your choice.

### File conversion 🔄

Save your file in the format of your choice. Simply click the **Convert** button, select the desired format from the list, and the file will be downloaded directly to your device.

### Managing file access permissions 🔐

By default, only the file owner (the post author) has editing rights, while other users can view the file.

To grant editing permissions to another user, click **Manage Permissions**, enter the username in the search bar, and click **Add Permissions**. Users with granted access will appear in the **Current Permissions** section within the same window.

## ONLYOFFICE Docs editions

Self-hosted ONLYOFFICE Docs offers different versions of its online document editors that can be deployed on your own servers.

**ONLYOFFICE Docs** packaged as Document Server:

* Community Edition 🆓 (`onlyoffice-documentserver` package)
* Enterprise Edition 🏢 (`onlyoffice-documentserver-ee` package)

The table below will help you to make the right choice.

| Pricing and licensing | Community Edition | Enterprise Edition |
| ------------- | ------------- | ------------- |
| | [Get it now](https://www.onlyoffice.com/download-community?utm_source=github&utm_medium=cpc&utm_campaign=GitHubDiscourse#docs-community)  | [Start Free Trial](https://www.onlyoffice.com/download?utm_source=github&utm_medium=cpc&utm_campaign=GitHubDiscourse#docs-enterprise)  |
| Cost  | FREE  | [Go to the pricing page](https://www.onlyoffice.com/docs-enterprise-prices?utm_source=github&utm_medium=cpc&utm_campaign=GitHubDiscourse)  |
| Simultaneous connections | up to 20 maximum  | As in chosen pricing plan |
| Number of users | up to 20 recommended | As in chosen pricing plan |
| License | GNU AGPL v.3 | Proprietary |
| **Support** | **Community Edition** | **Enterprise Edition** |
| Documentation | [Help Center](https://helpcenter.onlyoffice.com/docs/installation/community) | [Help Center](https://helpcenter.onlyoffice.com/docs/installation/enterprise) |
| Standard support | [GitHub](https://github.com/ONLYOFFICE/DocumentServer/issues) or paid | 1 or 3 years support included |
| Premium support | [Contact us](mailto:sales@onlyoffice.com) | [Contact us](mailto:sales@onlyoffice.com) |
| **Services** | **Community Edition** | **Enterprise Edition** |
| Conversion Service                | + | + |
| Document Builder Service          | + | + |
| **Interface** | **Community Edition** | **Enterprise Edition** |
| Tabbed interface                  | + | + |
| Dark theme                        | + | + |
| 125%, 150%, 175%, 200% scaling    | + | + |
| White Label                       | - | - |
| Integrated test example (node.js) | + | + |
| Mobile web editors                | - | +* |
| **Plugins & Macros** | **Community Edition** | **Enterprise Edition** |
| Plugins                           | + | + |
| Macros                            | + | + |
| **Collaborative capabilities** | **Community Edition** | **Enterprise Edition** |
| Two co-editing modes              | + | + |
| Comments                          | + | + |
| Built-in chat                     | + | + |
| Review and tracking changes       | + | + |
| Display modes of tracking changes | + | + |
| Version history                   | + | + |
| **Document Editor features** | **Community Edition** | **Enterprise Edition** |
| Font and paragraph formatting   | + | + |
| Object insertion                | + | + |
| Adding Content control          | + | + |
| Editing Content control         | + | + |
| Layout tools                    | + | + |
| Table of contents               | + | + |
| Navigation panel                | + | + |
| Mail Merge                      | + | + |
| Comparing Documents             | + | + |
| **Spreadsheet Editor features** | **Community Edition** | **Enterprise Edition** |
| Font and paragraph formatting   | + | + |
| Object insertion                | + | + |
| Functions, formulas, equations  | + | + |
| Table templates                 | + | + |
| Pivot tables                    | + | + |
| Data validation                 | + | + |
| Conditional formatting          | + | + |
| Sparklines                      | + | + |
| Sheet Views                     | + | + |
| **Presentation Editor features** | **Community Edition** | **Enterprise Edition** |
| Font and paragraph formatting   | + | + |
| Object insertion                | + | + |
| Transitions                     | + | + |
| Animations                      | + | + |
| Presenter mode                  | + | + |
| Notes                           | + | + |
| **Form creator features** | **Community Edition** | **Enterprise Edition** |
| Adding form fields              | + | + |
| Form preview                    | + | + |
| Saving as PDF                   | + | + |
| **PDF Editor features**      | **Community Edition** | **Enterprise Edition** |
| Text editing and co-editing                                | + | + |
| Work with pages (adding, deleting, rotating)               | + | + |
| Inserting objects (shapes, images, hyperlinks, etc.)       | + | + |
| Text annotations (highlight, underline, cross out, stamps) | + | + |
| Comments                        | + | + |
| Freehand drawings               | + | + |
| Form filling                    | + | + |
| | [Get it now](https://www.onlyoffice.com/download-community?utm_source=github&utm_medium=cpc&utm_campaign=GitHubDiscourse#docs-community)  | [Start Free Trial](https://www.onlyoffice.com/download?utm_source=github&utm_medium=cpc&utm_campaign=GitHubDiscourse#docs-enterprise)  |

\* If supported by DMS.

## Need help? User Feedback and Support 💡

* **🐞 Found a bug?** Please report it by creating an [issue](https://github.com/ONLYOFFICE/onlyoffice-discourse/issues).
* **❓ Have a question?** Ask our community and developers on the [ONLYOFFICE Forum](https://community.onlyoffice.com).
* **👨‍💻 Need help for developers?** Check our [API documentation](https://api.onlyoffice.com).
* **💡 Want to suggest a feature?** Share your ideas on our [feedback platform](https://feedback.onlyoffice.com/forums/966080-your-voice-matters).