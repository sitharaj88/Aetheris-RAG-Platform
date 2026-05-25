import React from "react";
import Link from "next/link";
import { RefreshCw, Play, Shield, Globe } from "lucide-react";

export default function WorkflowPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <RefreshCw className="h-4 w-4" /> CI/CD Deployment
      </div>
      <h1>Manual GitHub Actions CI/CD</h1>
      <p className="text-text-secondary leading-relaxed">
        The documentation site is a static export configuration, meaning it can be built and served as flat HTML/CSS files without requiring a Node.js runtime.
      </p>

      <h2>The Manual Trigger (`workflow_dispatch`)</h2>
      <p>
        To prevent unnecessary builds and conserve Action limits, we trigger the deployment workflow manually. This allows you to verify document drafts locally and push updates to production only when needed.
      </p>

      <h2>Workflow Script Details</h2>
      <p>
        The workflow is stored in <code>.github/workflows/deploy-docs.yml</code>:
      </p>
      <pre>
        <code>{`name: Deploy Docs to GitHub Pages

on:
  workflow_dispatch: # Enables manual deployment button on GitHub

permissions:
  contents: write # Allows pushing the compiled HTML to the gh-pages branch

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'docs-site/package-lock.json'

      - name: Install Dependencies
        run: |
          cd docs-site
          npm ci

      - name: Build Static Site
        run: |
          cd docs-site
          npm run build

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: docs-site/out
          branch: gh-pages
          clean: true`}</code>
      </pre>

      <h2>How to Deploy Step-by-Step</h2>
      <div className="my-6 space-y-3">
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">1</div>
          <p className="text-xs text-text-secondary m-0">Push the workflow file and documentation changes to your primary branch (e.g. <code>main</code>).</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">2</div>
          <p className="text-xs text-text-secondary m-0">Go to your GitHub repository and click the **Actions** tab.</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">3</div>
          <p className="text-xs text-text-secondary m-0">In the left sidebar, click the **Deploy Docs to GitHub Pages** workflow.</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">4</div>
          <p className="text-xs text-text-secondary m-0">Click the **Run workflow** dropdown, choose the branch, and click the green **Run workflow** button.</p>
        </div>
      </div>

      <div className="doc-alert doc-alert-important">
        <strong>Repository Pages Setting:</strong> After running the workflow for the first time, go to your GitHub Repository Settings → **Pages** tab. Under **Build and deployment**, set the Source to **Deploy from a branch** and select the <code>gh-pages</code> branch with the <code>/ (root)</code> folder.
      </div>

      <div className="mt-8 flex justify-start">
        <Link 
          href="/setup/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Setup
        </Link>
      </div>
    </div>
  );
}
