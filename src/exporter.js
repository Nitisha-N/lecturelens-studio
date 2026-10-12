/**
 * Course Recap Exporter Module (Per-PDF Deck Markdown, Standalone HTML, and JSON)
 */

export function generateMarkdownExport(recapData) {
  let md = `# ${recapData.course_title || "LectureLens Recap Package"}\n\n`;
  md += `> **Executive Overview**: ${recapData.overview || ""}\n\n`;
  md += `- **Total Slides Analyzed**: ${recapData.total_slides || 0}\n`;
  
  if (recapData.deck_recaps && recapData.deck_recaps.length > 0) {
    md += `- **PDF Decks Included**: ${recapData.deck_recaps.length}\n\n`;

    recapData.deck_recaps.forEach((deck, dIdx) => {
      md += `\n==================================================\n`;
      md += `# PDF Deck ${dIdx + 1}: ${deck.source_file || deck.deck_title}\n`;
      md += `==================================================\n\n`;

      md += `### 📄 Overview\n${deck.overview}\n\n`;
      md += `- **Slides Count**: ${deck.slides_count}\n`;
      md += `- **Modules**: ${deck.modules.length}\n\n`;

      md += `## 🗺️ Visual Diagrams (${deck.source_file})\n\n`;
      if (deck.mermaid_diagrams && deck.mermaid_diagrams.length > 0) {
        deck.mermaid_diagrams.forEach(diag => {
          md += `### ${diag.title}\n\n\`\`\`mermaid\n${diag.code}\n\`\`\`\n\n`;
        });
      }

      md += `## 📚 Module Summaries & Glossary (${deck.source_file})\n\n`;
      deck.modules.forEach((mod, idx) => {
        const statusSymbol = mod.approved ? "✅ [Reviewed]" : "📌";
        md += `### Module ${idx + 1}: ${mod.module_name} ${statusSymbol}\n\n`;
        md += `*Covering: ${mod.slides_covered}*\n\n`;
        md += `${mod.summary}\n\n`;

        if (mod.key_concepts && mod.key_concepts.length > 0) {
          md += `#### Key Terminology & Definitions\n\n`;
          md += `| Term | Definition | Slide Ref |\n`;
          md += `| :--- | :--- | :---: |\n`;
          mod.key_concepts.forEach(c => {
            md += `| **${c.term}** | ${c.definition} | Slide ${c.slide_ref || "-"} |\n`;
          });
          md += `\n`;
        }

        if (mod.formulas_or_code && mod.formulas_or_code.length > 0) {
          md += `#### Key Formulas / Code Snippets\n\n\`\`\`text\n`;
          mod.formulas_or_code.forEach(code => md += `${code}\n`);
          md += `\`\`\`\n\n`;
        }

        if (mod.takeaways && mod.takeaways.length > 0) {
          md += `#### Key Takeaways\n\n`;
          mod.takeaways.forEach(t => md += `- ${t}\n`);
          md += `\n`;
        }
      });

      if (deck.review_questions && deck.review_questions.length > 0) {
        md += `## ❓ Review Questions (${deck.source_file})\n\n`;
        deck.review_questions.forEach((q, idx) => {
          md += `### Q${idx + 1}: ${q.question}\n\n`;
          md += `**Answer**: ${q.answer}\n\n`;
        });
      }
    });
  } else {
    // Single deck fallback format
    md += `---\n\n## 🗺️ Visual Course Diagrams\n\n`;
    if (recapData.mermaid_diagrams && recapData.mermaid_diagrams.length > 0) {
      recapData.mermaid_diagrams.forEach(diag => {
        md += `### ${diag.title}\n\n\`\`\`mermaid\n${diag.code}\n\`\`\`\n\n`;
      });
    }

    md += `---\n\n## 📚 Module Summaries & Glossary\n\n`;
    if (recapData.modules) {
      recapData.modules.forEach((mod, idx) => {
        const statusSymbol = mod.approved ? "✅ [Reviewed]" : "📌";
        md += `### Module ${idx + 1}: ${mod.module_name} ${statusSymbol}\n\n`;
        md += `*Covering: ${mod.slides_covered}*\n\n`;
        md += `${mod.summary}\n\n`;

        if (mod.key_concepts && mod.key_concepts.length > 0) {
          md += `#### Key Terminology & Definitions\n\n`;
          md += `| Term | Definition | Slide Ref |\n`;
          md += `| :--- | :--- | :---: |\n`;
          mod.key_concepts.forEach(c => {
            md += `| **${c.term}** | ${c.definition} | Slide ${c.slide_ref || "-"} |\n`;
          });
          md += `\n`;
        }

        if (mod.formulas_or_code && mod.formulas_or_code.length > 0) {
          md += `#### Key Formulas / Code Snippets\n\n\`\`\`text\n`;
          mod.formulas_or_code.forEach(code => md += `${code}\n`);
          md += `\`\`\`\n\n`;
        }

        if (mod.takeaways && mod.takeaways.length > 0) {
          md += `#### Key Takeaways\n\n`;
          mod.takeaways.forEach(t => md += `- ${t}\n`);
          md += `\n`;
        }
      });
    }

    if (recapData.review_questions && recapData.review_questions.length > 0) {
      md += `---\n\n## ❓ Self-Assessment Review Questions\n\n`;
      recapData.review_questions.forEach((q, idx) => {
        md += `### Q${idx + 1}: ${q.question}\n\n`;
        md += `**Answer**: ${q.answer}\n\n`;
      });
    }
  }

  return md;
}

export function generateHtmlExport(recapData) {
  const mdContent = generateMarkdownExport(recapData);
  const htmlBody = window.marked ? window.marked.parse(mdContent) : mdContent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${recapData.course_title || "LectureLens Recap Package"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; background: #f8fafc; }
    h1, h2, h3 { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #e2e8f0; }
    blockquote { background: #ccfbf1; border-left: 4px solid #0f766e; padding: 12px 16px; margin: 0 0 20px 0; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    .mermaid { background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
  ${htmlBody}
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;
}

export function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
