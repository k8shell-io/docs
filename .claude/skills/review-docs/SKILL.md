---
name: review-docs
description: Performs a thorough review of Kubernetes-based open-source workspace technical documentation and formats suggestions for a GitHub Pull Request.
triggers:
  - "review the documentation"
  - "check technical docs"
---

# Skill: Review Documentation

## Context
The user is working in a repository containing technical documentation for Kubernetes-based (k8s) open-source development workspaces (e.g., workspaces utilizing containers, pods, operators, configmaps, ingress, or custom CRDs to provision remote dev environments).

## Objective
Analyze the technical markdown files within this repository to find gaps, technical inaccuracies, onboarding friction, and formatting errors. Provide clear, actionable inline-style suggestions optimized for a human reviewer to verify and merge via a GitHub Pull Request.

## Execution Steps

1. **Locate Documentation**: Scan the repository for technical documentation files (typically `.md`, `.mdx`, or files inside `docs/`, `architecture/`, or `README.md`).
2. **Analyze Content**: Evaluate the documentation against the following criteria:
   - **K8s Invariants**: Ensure cluster requirements, namespaces, resource limits, and prerequisites (e.g., kubectl, helm, minikube/kind) are clearly documented.
   - **Onboarding Friction**: Identify steps that are missing, out of order, or assume hidden knowledge.
   - **Technical Inaccuracies**: Look for outdated versions, invalid yaml references, or configuration mismatch blocks.
   - **Formatting & Style**: Verify broken internal/external markdown links, invalid code block syntax highlighting, and typographic errors.
3. **Generate PR-Ready Output**: Produce a structured review output. Do not overwrite the files directly; present the recommendations clearly in the chat environment so the user can easily review them or output them into a PR description.

## Output Format
Format the final report using the following structure:

### 📑 Documentation Audit Summary
*A brief 2-3 sentence assessment of the current documentation state.*

### 🛠️ Technical Fixes & Inaccuracies
*List critical technical issues found (e.g., broken K8s configs, missing prerequisites).*
- **File**: `path/to/file.md`
- **Issue**: Description of the problem.
- **Suggested Change**:
  ```markdown
  [Insert exact corrected markdown or configuration block here]
  ```

### 🚀 Developer Experience & Clarity Improvements
*List structural, readability, or onboarding optimizations.*
- **File**: `path/to/file.md`
- **Location**: (e.g., Section "Getting Started")
- **Suggestion**: Detailed description of what to add/modify to improve human comprehension.

### 📝 Typos & Formatting
*A markdown table summarizing quick wins.*

| File | Current Text | Suggested Fix | Reason |
| :--- | :--- | :--- | :--- |
| `docs/setup.md` | `kubctl apply` | `kubectl apply` | Typo |
