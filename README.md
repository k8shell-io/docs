# K8Shell Documentation

This repository contains the documentation website for K8Shell, built with [Docusaurus](https://docusaurus.io/).

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18.0 or above)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/k8shell-io/docs.git
cd docs

# Install dependencies
npm install
```

### Local Development

```bash
# Start the development server
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

The site will be available at: `http://localhost:3000/docs/`

### Build

```bash
# Build the website for production
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Project Structure

```
docs/
├── blog/                   # Blog posts
│   ├── authors.yml        # Blog authors configuration
│   └── *.md              # Blog post files
├── docs/                  # Documentation pages
│   ├── intro.md          # Main documentation entry
│   ├── installation.md   # Installation guide
│   └── tutorial-basics/  # Tutorial section
├── src/
│   ├── components/       # React components
│   ├── css/             # Custom CSS
│   └── pages/           # Custom pages
├── static/              # Static assets (images, etc.)
├── docusaurus.config.ts # Docusaurus configuration
├── sidebars.ts         # Documentation sidebar
└── package.json        # Dependencies and scripts
```
