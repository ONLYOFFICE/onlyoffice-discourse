# Contribution

## Requirements

- Node.js >= 22
- Ruby >= 3.3
- pnpm 9.x

## Dependencies Installation

1. **Clone the repository** into your Discourse plugins directory:
   ```bash
   cd discourse/plugins
   git clone https://github.com/ONLYOFFICE/onlyoffice-discourse.git
   cd onlyoffice-discourse
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   bundle install
   ```

3. **Install git hooks**:
   ```bash
   pnpm prepare
   ```
