import { parsePdfFile, parseMultiplePdfFiles, SAMPLE_DECKS } from './pdf_parser.js';
import { generateCourseRecap } from './recap_generator.js';
import { generateMarkdownExport, generateHtmlExport, downloadFile } from './exporter.js';

// Application State
const state = {
  currentSlides: [],
  recapData: null,
  activeSlideIdx: 0,
  apiKey: localStorage.getItem('gemini_api_key') || '',
  customPrompt: '',
  approvedModules: new Set()
};

// DOM Elements
const elements = {
  uploadSection: document.getElementById('uploadSection'),
  processingSection: document.getElementById('processingSection'),
  dashboardSection: document.getElementById('dashboardSection'),
  pdfFileInput: document.getElementById('pdfFileInput'),
  dropzone: document.getElementById('dropzone'),
  
  // Progress
  processingStatusText: document.getElementById('processingStatusText'),
  processingDetailText: document.getElementById('processingDetailText'),
  progressBarFill: document.getElementById('progressBarFill'),

  // Inspector
  slideCountBadge: document.getElementById('slideCountBadge'),
  slideList: document.getElementById('slideList'),
  rawTextContent: document.getElementById('rawTextContent'),
  
  // Overview & Stats
  courseTitle: document.getElementById('courseTitle'),
  courseOverview: document.getElementById('courseOverview'),
  statSlides: document.getElementById('statSlides'),
  statModules: document.getElementById('statModules'),
  statConcepts: document.getElementById('statConcepts'),
  statDiagrams: document.getElementById('statDiagrams'),

  // Panes & Containers
  diagramsContainer: document.getElementById('diagramsContainer'),
  modulesContainer: document.getElementById('modulesContainer'),
  quizContainer: document.getElementById('quizContainer'),

  // Progress Bar
  approvalText: document.getElementById('approvalText'),
  approvalBarFill: document.getElementById('approvalBarFill'),

  // Buttons & Modals
  exportBtn: document.getElementById('exportBtn'),
  sampleDeckBtn: document.getElementById('sampleDeckBtn'),
  apiKeyModalBtn: document.getElementById('apiKeyModalBtn'),
  settingsModal: document.getElementById('settingsModal'),
  geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  
  exportModal: document.getElementById('exportModal'),
  closeExportModalBtn: document.getElementById('closeExportModalBtn'),
  downloadFileBtn: document.getElementById('downloadFileBtn'),
  mdExportPreview: document.getElementById('mdExportPreview'),
  htmlExportPreview: document.getElementById('htmlExportPreview'),
  jsonExportPreview: document.getElementById('jsonExportPreview')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  initMermaid();
});

function initMermaid() {
  if (!window.mermaid) return;

  // Bright pastel fills + dark text => readable on the dark background
  const fills = ['#5eead4', '#93c5fd', '#c4b5fd', '#f9a8d4', '#fcd34d', '#86efac',
                 '#fdba74', '#67e8f9', '#a5b4fc', '#f0abfc', '#bef264', '#fda4af'];
  const scale = {};
  fills.forEach((c, i) => {
    scale[`cScale${i}`] = c;
    scale[`cScaleLabel${i}`] = '#0b1220';
    scale[`cScaleInv${i}`] = c;
  });

  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 16,
    themeVariables: {
      darkMode: true,
      background: '#090d16',
      fontSize: '16px',
      // flowchart
      primaryColor: '#134e4a',
      primaryTextColor: '#f1f5f9',
      primaryBorderColor: '#5eead4',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a',
      lineColor: '#5eead4',
      textColor: '#f1f5f9',
      // mindmap root node
      git0: '#0f766e',
      gitBranchLabel0: '#ffffff',
      ...scale
    },
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis', padding: 16, nodeSpacing: 40, rankSpacing: 50 },
    mindmap: { useMaxWidth: false, padding: 24, maxNodeWidth: 220 }
  });
}

function initEvents() {
  // File Upload Dropzone
  elements.pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handlePdfUpload(e.target.files);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      elements.dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      elements.dropzone.classList.remove('dragover');
    });
  });

  elements.dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files);
    }
  });

  // Demo Deck Chips
  document.querySelectorAll('.demo-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sampleKey = e.target.getAttribute('data-sample');
      loadSampleDeck(sampleKey);
    });
  });

  elements.sampleDeckBtn.addEventListener('click', () => {
    loadSampleDeck('neural_nets');
  });

  // Tab Navigation (Inspector)
  document.querySelectorAll('.inspector-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.inspector-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.slide-inspector .tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // View Navigation (Recap Viewport)
  document.querySelectorAll('.view-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-pane').forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const viewId = btn.getAttribute('data-view');
      document.getElementById(viewId).classList.remove('hidden');
    });
  });

  // Settings Modal
  elements.apiKeyModalBtn.addEventListener('click', () => {
    elements.geminiApiKeyInput.value = state.apiKey;
    elements.settingsModal.classList.remove('hidden');
  });

  elements.closeModalBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  elements.saveSettingsBtn.addEventListener('click', () => {
    state.apiKey = elements.geminiApiKeyInput.value.trim();
    localStorage.setItem('gemini_api_key', state.apiKey);
    elements.settingsModal.classList.add('hidden');
  });

  // Export Modal
  elements.exportBtn.addEventListener('click', openExportModal);
  elements.closeExportModalBtn.addEventListener('click', () => elements.exportModal.classList.add('hidden'));

  document.querySelectorAll('.export-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.export-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.export-tab-pane').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-export-tab');
      document.getElementById(tabId).classList.remove('hidden');
    });
  });

  elements.downloadFileBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.export-tabs .tab-btn.active').getAttribute('data-export-tab');
    if (activeTab === 'mdExportTab') {
      downloadFile(elements.mdExportPreview.value, `${state.recapData.course_title}_recap.md`, 'text/markdown');
    } else if (activeTab === 'htmlExportTab') {
      downloadFile(elements.htmlExportPreview.value, `${state.recapData.course_title}_recap.html`, 'text/html');
    } else {
      downloadFile(elements.jsonExportPreview.value, `${state.recapData.course_title}_recap.json`, 'application/json');
    }
  });

  // Regenerate Diagrams
  const regenBtn = document.getElementById('regenerateDiagramsBtn');
  if (regenBtn) {
    regenBtn.addEventListener('click', async () => {
      if (state.currentSlides.length > 0) {
        processSlidesAndRender(state.currentSlides);
      }
    });
  }
}

async function handlePdfUpload(files) {
  const fileArray = Array.from(files);
  const countText = fileArray.length > 1 ? `${fileArray.length} PDF Decks` : fileArray[0].name;
  
  showProcessing(true, `Extracting ${countText}...`, "Parsing PDF pages, text structures, and code blocks...");
  updateProgress(20);

  try {
    const slides = await parseMultiplePdfFiles(fileArray);
    updateProgress(50);
    state.currentSlides = slides;
    await processSlidesAndRender(slides);
  } catch (error) {
    alert("Error parsing PDF files: " + error.message);
    showProcessing(false);
  }
}

function loadSampleDeck(key) {
  const sample = SAMPLE_DECKS[key] || SAMPLE_DECKS.neural_nets;
  showProcessing(true, `Loading Sample: ${sample.title}`, "Preparing slide contents...");
  updateProgress(40);
  
  setTimeout(async () => {
    state.currentSlides = sample.slides;
    await processSlidesAndRender(sample.slides);
  }, 400);
}

async function processSlidesAndRender(slides) {
  showProcessing(true, "Synthesizing AI Recap & Mermaid Diagrams...", "Generating glossaries, code blocks, and visual maps...");
  updateProgress(75);

  state.recapData = await generateCourseRecap(slides, state.apiKey, state.customPrompt);
  updateProgress(100);

  setTimeout(() => {
    renderDashboard();
    showProcessing(false);
  }, 300);
}

function showProcessing(show, title = "", detail = "") {
  if (show) {
    elements.uploadSection.classList.add('hidden');
    elements.dashboardSection.classList.add('hidden');
    elements.processingSection.classList.remove('hidden');
    elements.processingStatusText.textContent = title;
    elements.processingDetailText.textContent = detail;
  } else {
    elements.processingSection.classList.add('hidden');
    elements.dashboardSection.classList.remove('hidden');
  }
}

function updateProgress(percent) {
  elements.progressBarFill.style.width = `${percent}%`;
}

function renderDashboard() {
  const data = state.recapData;
  state.approvedModules.clear();

  // Overview Banner
  elements.courseTitle.textContent = data.course_title;
  elements.courseOverview.textContent = data.overview;
  elements.statSlides.textContent = data.total_slides;
  elements.statModules.textContent = data.modules.length;
  
  let conceptCount = 0;
  data.modules.forEach(m => conceptCount += (m.key_concepts?.length || 0));
  elements.statConcepts.textContent = conceptCount;
  elements.statDiagrams.textContent = data.mermaid_diagrams?.length || 0;

  elements.slideCountBadge.textContent = `${data.total_slides} Slides`;
  elements.exportBtn.removeAttribute('disabled');

  // Render Inspector Slide List
  renderSlideInspector();

  // Render Diagrams
  renderDiagrams(data.mermaid_diagrams || []);

  // Render Modules
  renderModules(data.modules || []);

  // Render Quiz
  renderQuiz(data.review_questions || []);

  // Update Progress
  updateApprovalProgress();
}

function renderSlideInspector() {
  elements.slideList.innerHTML = '';
  let fullRawText = '';

  state.currentSlides.forEach((slide, idx) => {
    const fileTag = slide.source_file ? `<span title="${slide.source_file}" style="max-width:120px; overflow:hidden; text-overflow:ellipsis; display:inline-block;">📁 ${slide.source_file}</span>` : '';
    fullRawText += `=== Slide ${slide.slide_number} (${slide.source_file || 'Deck'}): ${slide.title} ===\n${slide.body}\n\n`;

    const card = document.createElement('div');
    card.className = `slide-card ${idx === 0 ? 'active' : ''}`;
    card.innerHTML = `
      <div class="slide-card-header">
        <span>Slide ${slide.slide_number}</span>
        ${fileTag}
        <span>${slide.word_count || 0} w</span>
      </div>
      <div class="slide-card-title">${slide.title}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.slide-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.activeSlideIdx = idx;
    });

    elements.slideList.appendChild(card);
  });

  elements.rawTextContent.textContent = fullRawText;
}

function renderDiagrams(diagrams) {
  elements.diagramsContainer.innerHTML = '';

  diagrams.forEach((diag, idx) => {
    const card = document.createElement('div');
    card.className = 'diagram-card';
    const diagramId = `mermaid-render-${idx}`;

    card.innerHTML = `
      <div class="diagram-header">
        <h4>${diag.title}</h4>
        <span class="badge">${diag.type.toUpperCase()}</span>
      </div>
      <div class="mermaid-viewport">
        <div id="${diagramId}" class="mermaid-target"></div>
      </div>
    `;

    elements.diagramsContainer.appendChild(card);
  });

  // Render Mermaid graphics (code is passed as text, never parsed as HTML)
  setTimeout(async () => {
    if (!window.mermaid) return;
    for (let idx = 0; idx < diagrams.length; idx++) {
      const target = document.getElementById(`mermaid-render-${idx}`);
      if (!target) continue;
      try {
        const { svg } = await window.mermaid.render(`mermaid-svg-${Date.now()}-${idx}`, diagrams[idx].code);
        target.innerHTML = svg;
      } catch (err) {
        console.error('[Mermaid] render failed:', err, diagrams[idx].code);
        document.querySelectorAll('[id^="dmermaid-svg-"]').forEach(n => n.remove());
        target.innerHTML = '<p class="diagram-error">This diagram could not be rendered. Check the browser console for the Mermaid source.</p>';
      }
    }
  }, 100);
}

function renderModules(modules) {
  elements.modulesContainer.innerHTML = '';

  modules.forEach((mod, idx) => {
    const card = document.createElement('div');
    card.className = 'module-card';
    card.setAttribute('data-module-idx', idx);

    let conceptsHtml = '';
    if (mod.key_concepts && mod.key_concepts.length > 0) {
      conceptsHtml = `
        <table class="concepts-table">
          <thead>
            <tr><th>Concept / Term</th><th>Explanation / Definition</th><th>Slide</th></tr>
          </thead>
          <tbody>
            ${mod.key_concepts.map(c => `
              <tr>
                <td><strong>${c.term}</strong></td>
                <td>${c.definition}</td>
                <td>Slide ${c.slide_ref || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let codeHtml = '';
    if (mod.formulas_or_code && mod.formulas_or_code.length > 0) {
      codeHtml = `
        <div class="code-block">${mod.formulas_or_code.join('\n')}</div>
      `;
    }

    card.innerHTML = `
      <div class="module-header">
        <div class="module-title-box">
          <h4 class="module-title">${mod.module_name}</h4>
          <span class="module-slides-tag">${mod.slides_covered}</span>
        </div>
        <div class="module-actions">
          <label class="approve-checkbox-label">
            <input type="checkbox" class="approve-checkbox" data-idx="${idx}">
            Reviewed & Approved
          </label>
        </div>
      </div>
      <p class="module-summary">${mod.summary}</p>
      ${conceptsHtml}
      ${codeHtml}
    `;

    const checkbox = card.querySelector('.approve-checkbox');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.approvedModules.add(idx);
        card.classList.add('approved');
        mod.approved = true;
      } else {
        state.approvedModules.delete(idx);
        card.classList.remove('approved');
        mod.approved = false;
      }
      updateApprovalProgress();
    });

    elements.modulesContainer.appendChild(card);
  });
}

function renderQuiz(questions) {
  elements.quizContainer.innerHTML = '';
  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-question">
        <span class="badge">Q${idx + 1}</span>
        <span>${q.question}</span>
      </div>
      <div class="quiz-answer">${q.answer}</div>
    `;
    elements.quizContainer.appendChild(card);
  });
}

function updateApprovalProgress() {
  const total = state.recapData?.modules?.length || 0;
  const count = state.approvedModules.size;
  elements.approvalText.textContent = `${count} of ${total} Modules Reviewed`;
  const pct = total > 0 ? (count / total) * 100 : 0;
  elements.approvalBarFill.style.width = `${pct}%`;
}

function openExportModal() {
  if (!state.recapData) return;
  const md = generateMarkdownExport(state.recapData);
  const html = generateHtmlExport(state.recapData);
  const json = JSON.stringify(state.recapData, null, 2);

  elements.mdExportPreview.value = md;
  elements.htmlExportPreview.value = html;
  elements.jsonExportPreview.value = json;

  elements.exportModal.classList.remove('hidden');
}
