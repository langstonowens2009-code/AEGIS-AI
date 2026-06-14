// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

// -------------------------------------------------------------
// HIGH-FIDELITY PRESET TEMPLATES
// -------------------------------------------------------------
const PRESETS = {
  caffeine: [
    {
      id: 'paper-1',
      title: 'Moderate caffeine intake and resting heart rate: a cohort study',
      authors: 'A. Jenkins, B. Smith',
      year: '2024',
      journal: 'Journal of Cardiovascular Science',
      doi: '10.1016/j.jcvs.2024.01.008',
      sampleSize: '120',
      text: 'Study A evaluated caffeine safety. In a cohort of 120 patients, we found that moderate caffeine consumption did not significantly increase resting heart rate. The cardiovascular profiles were highly consistent with the placebo group. We concluded that daily intake up to 300mg is well-tolerated cardiovascularly. However, minor limitations include self-reported diaries and a focus on healthy adults.',
      collapsed: false
    },
    {
      id: 'paper-2',
      title: 'Caffeine ingestion over four weeks in healthy volunteers',
      authors: 'C. Evans, D. Cooper',
      year: '2023',
      journal: 'Sleep Medicine & Clinical Practice',
      doi: '10.1007/s11325-023-01824-w',
      sampleSize: '80',
      text: 'Study B analyzed sleep and baseline metrics. A sample size of 80 participants was evaluated over a 4-week duration. Caffeine ingestion showed a similarly minimal impact on baseline heart rate, supporting the safety findings of Jenkins et al. However, mild insomnia was reported in 15% of the subjects, representing a secondary discrepancy. Also, dietary caffeine was not strictly regulated.',
      collapsed: false
    },
    {
      id: 'paper-3',
      title: 'Caffeine effects on arterial stiffness and blood pressure',
      authors: 'E. Martinez, F. Zhao',
      year: '2025',
      journal: 'Hypertension Research & Reviews',
      doi: '10.1111/hrr.12908',
      sampleSize: '150',
      text: 'Study C analyzed cardiovascular pressure. We examined caffeine effects in n = 150 healthy adults. The heart rate readings agreed closely with baseline measurements, confirming no resting tachycardia. Nevertheless, a minor temporary increase in blood pressure was noted, which differed from earlier findings. Discrepancies exist regarding long-term arterial effects, presenting potential bias in younger demographics.',
      collapsed: false
    }
  ],
  vitamind: [
    {
      id: 'paper-1',
      title: 'Daily Vitamin D supplementation and viral infection immunity',
      authors: 'H. Patel, K. Albright',
      year: '2023',
      journal: 'Immune Response & Virology',
      doi: '10.1016/j.imrv.2023.08.012',
      sampleSize: '250',
      text: 'Abstract 1 evaluated daily doses. Vitamin D supplementation was tested in a sample size of 250 participants. The treatment group showed a 15% reduction in viral infections, confirming that daily doses support immune response. These results are consistent with previous pilot studies. However, the trial did not account for seasonal sun exposure limitations.',
      collapsed: false
    },
    {
      id: 'paper-2',
      title: 'High-dose Vitamin D therapy versus placebo in acute infections',
      authors: 'M. Gellar, R. Vance',
      year: '2024',
      journal: 'New England Journal of Medical Trials',
      doi: '10.1056/NEJMT240182',
      sampleSize: '150',
      text: 'Abstract 2 looked at hospitalized treatment. A total of 150 patients were randomized in our trial. We observed no significant difference in infection rates or recovery duration between Vitamin D and placebo. However, the dose utilized differed from standard clinical protocols. Key limitations include the late administration of therapy after symptom onset.',
      collapsed: false
    },
    {
      id: 'paper-3',
      title: 'Serum 25-hydroxyvitamin D and severity of respiratory syndromes',
      authors: 'T. Nakamura, S. Al-Mansoor',
      year: '2025',
      journal: 'Clinical Nutrition & Immunity',
      doi: '10.1007/cni-2025-092',
      sampleSize: '110',
      text: 'Abstract 3 checked baseline serum. We evaluated Vitamin D blood levels in n = 110 subjects. Higher baseline levels were agreed to correlate with lower infection severity and faster recovery. Still, limitations like lack of dietary control exist, contrarily to more rigorous randomized trials. Discrepancies between observational and randomized trials remain unresolved.',
      collapsed: false
    }
  ]
};

// -------------------------------------------------------------
// APP STATE STATE-MANAGEMENT
// -------------------------------------------------------------
let papers = [];
let dragSourceCardIndex = null;

// DOM Cache
const papersListContainer = document.getElementById('papers-list-container');
const papersEmptyState = document.getElementById('papers-empty-state');
const btnAddPaper = document.getElementById('btn-add-paper');
const btnImportFiles = document.getElementById('btn-import-files');
const fileImportInput = document.getElementById('file-import-input');
const btnAnalyzeAll = document.getElementById('btn-analyze-all');

const btnDownloadSummary = document.getElementById('btn-download-summary');
const btnExportResults = document.getElementById('btn-export-results');
const btnHome = document.getElementById('btn-home');

const aiStatusIndicator = document.getElementById('ai-status-indicator');
const aiStatusText = document.getElementById('ai-status-text');

const counterPapers = document.getElementById('counter-papers');
const counterCohort = document.getElementById('counter-cohort');
const metricEvidenceScore = document.getElementById('metric-evidence-score');
const metricBiasScore = document.getElementById('metric-bias-score');

const individualSummariesContainer = document.getElementById('individual-summaries-container');
const consensusDashboardList = document.getElementById('consensus-dashboard-list');
const conflictsDashboardList = document.getElementById('conflicts-dashboard-list');
const topicClustersContainer = document.getElementById('topic-clusters-container');
const similarityScoreText = document.getElementById('similarity-score-text');

const gaugeQualityCircle = document.getElementById('gauge-quality-circle');
const gaugeQualityValue = document.getElementById('gauge-quality-value');
const gaugeBiasCircle = document.getElementById('gauge-bias-circle');
const gaugeBiasValue = document.getElementById('gauge-bias-value');
const gaugeSupportCircle = document.getElementById('gauge-support-circle');
const gaugeSupportValue = document.getElementById('gauge-support-value');

const limitationsDashboardGrid = document.getElementById('limitations-dashboard-grid');
const matrixDashboardBody = document.getElementById('matrix-dashboard-body');

const processingOverlay = document.getElementById('processing-overlay');
const loaderProgressBar = document.getElementById('loader-progress-bar');
const loaderDetailsText = document.getElementById('loader-details-text');

// -------------------------------------------------------------
// INITIALIZATION & EVENT LISTENERS
// -------------------------------------------------------------
function init() {
  bindEvents();
  renderPapers(); 
}

function bindEvents() {
  btnAddPaper.addEventListener('click', () => addPaperCard());
  btnImportFiles.addEventListener('click', () => fileImportInput.click());
  fileImportInput.addEventListener('change', handleFileImport);
  btnAnalyzeAll.addEventListener('click', runFullAnalysis);
  
  btnDownloadSummary.addEventListener('click', downloadSummaryFile);
  btnExportResults.addEventListener('click', exportDatasetFile);
  btnHome.addEventListener('click', navigateHome);
  
  // Setup file drop zone on Left Panel
  const leftPanel = document.querySelector('aside');
  leftPanel.addEventListener('dragover', (e) => {
    e.preventDefault();
    leftPanel.classList.add('bg-indigo-950/15');
  });
  leftPanel.addEventListener('dragleave', () => {
    leftPanel.classList.remove('bg-indigo-950/15');
  });
  leftPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    leftPanel.classList.remove('bg-indigo-950/15');
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });
}

function navigateHome() {
  papers = [];
  renderPapers();
  
  aiStatusIndicator.classList.add('hidden');
  aiStatusIndicator.classList.remove('flex');
  aiStatusText.textContent = "Idle";
  
  counterPapers.textContent = "0";
  counterCohort.textContent = "0";
  
  const consensusContainer = document.getElementById('consensus-summary-text');
  if (consensusContainer) {
    consensusContainer.innerHTML = `<span class="italic text-slate-500">No consensus points computed yet. Ensure studies are analyzed.</span>`;
  }
  
  const discrepancyContainer = document.getElementById('discrepancy-summary-text');
  if (discrepancyContainer) {
    discrepancyContainer.innerHTML = `<span class="italic text-slate-500">No conflicting parameters identified yet.</span>`;
  }
  
  const limitationsContainer = document.getElementById('limitations-future-text');
  if (limitationsContainer) {
    limitationsContainer.innerHTML = `<span class="italic text-slate-500">No research papers analyzed yet. Run analysis to generate limitations and future directions.</span>`;
  }
  
  lucide.createIcons();
}

// -------------------------------------------------------------
// PAPER CARDS RENDERING & STATE MUTATIONS
// -------------------------------------------------------------
function addPaperCard(data = {}) {
  const paperId = data.id || `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newPaper = {
    id: paperId,
    title: data.title || '',
    authors: data.authors || '',
    year: data.year || '',
    journal: data.journal || '',
    doi: data.doi || '',
    sampleSize: data.sampleSize || '',
    text: data.text || '',
    collapsed: data.collapsed !== undefined ? data.collapsed : false,
    metadataOpen: false
  };
  
  papers.push(newPaper);
  renderPapers();
  scrollToCard(paperId);
}

function scrollToCard(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function deletePaperCard(id) {
  papers = papers.filter(p => p.id !== id);
  renderPapers();
}

function toggleCollapse(id) {
  const p = papers.find(paper => paper.id === id);
  if (p) p.collapsed = !p.collapsed;
  renderPapers();
}

function toggleMetadata(id) {
  const p = papers.find(paper => paper.id === id);
  if (p) {
    p.metadataOpen = !p.metadataOpen;
    const content = document.getElementById(`meta-content-${id}`);
    const arrow = document.getElementById(`meta-arrow-${id}`);
    if (content && arrow) {
      if (p.metadataOpen) {
        content.classList.add('open');
        arrow.classList.add('rotate-180');
      } else {
        content.classList.remove('open');
        arrow.classList.remove('rotate-180');
      }
    }
  }
}

function updatePaperState(id, field, value) {
  const p = papers.find(paper => paper.id === id);
  if (p) {
    if (field.startsWith('meta.')) {
      const metaField = field.split('.')[1];
      p[metaField] = value; // flat metadata object to keep code simple
    } else {
      p[field] = value;
    }
    
    // Live update indicators for word count/reading time
    if (field === 'text') {
      const words = countWords(value);
      const readTime = Math.max(1, Math.ceil(words / 220));
      const wordBadge = document.getElementById(`word-badge-${id}`);
      const timeBadge = document.getElementById(`time-badge-${id}`);
      if (wordBadge) wordBadge.textContent = `${words.toLocaleString()} words`;
      if (timeBadge) timeBadge.textContent = `${readTime} min read`;
    }
  }
}

function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function renderPapers() {
  if (papers.length === 0) {
    papersEmptyState.classList.remove('hidden');
  } else {
    papersEmptyState.classList.add('hidden');
  }
  
  // We clean container, maintaining references/focused fields requires saving value to state.
  papersListContainer.querySelectorAll('.paper-card-element').forEach(el => el.remove());
  
  papers.forEach((paper, idx) => {
    const card = document.createElement('div');
    card.id = paper.id;
    card.className = `paper-card-element animate-slide-up bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden relative transition-all duration-300 group`;
    card.draggable = true;
    
    // Setup HTML5 Drag and Drop events
    card.addEventListener('dragstart', (e) => {
      dragSourceCardIndex = idx;
      card.classList.add('paper-card-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag-over-indicator');
    });
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over-indicator');
    });
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over-indicator');
      if (dragSourceCardIndex !== null && dragSourceCardIndex !== idx) {
        // Swap elements in state
        const temp = papers[dragSourceCardIndex];
        papers.splice(dragSourceCardIndex, 1);
        papers.splice(idx, 0, temp);
        renderPapers();
      }
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('paper-card-dragging');
      dragSourceCardIndex = null;
    });

    const words = countWords(paper.text);
    const readingTime = Math.max(1, Math.ceil(words / 220));
    
    card.innerHTML = `
      <!-- Drag Handle & Card Header -->
      <div class="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between select-none">
        <div class="flex items-center gap-2">
          <div class="cursor-grab text-slate-400 hover:text-slate-600 p-1">
            <i data-lucide="grip-vertical" class="w-4 h-4"></i>
          </div>
          <span class="text-xs font-bold text-black font-heading">PAPER #${idx + 1}</span>
          <span class="w-1.5 h-1.5 rounded-full ${paper.text ? 'bg-emerald-500' : 'bg-slate-700'}"></span>
        </div>
        
        <div class="flex items-center gap-3">
          <span id="time-badge-${paper.id}" class="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-mono">${readingTime} min read</span>
          <span id="word-badge-${paper.id}" class="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-mono">${words.toLocaleString()} words</span>
          
          <button onclick="toggleCollapse('${paper.id}')" class="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition cursor-pointer">
            <i data-lucide="${paper.collapsed ? 'maximize-2' : 'minimize-2'}" class="w-3.5 h-3.5"></i>
          </button>
          
          <button onclick="deletePaperCard('${paper.id}')" class="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition cursor-pointer">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
      
      <!-- Card Body Content -->
      <div class="p-4 space-y-3 ${paper.collapsed ? 'hidden' : ''}">
        
        <!-- Document Inputs/Uploads drag zone -->
        <div class="relative group/zone">
          <textarea 
            placeholder="Paste research article content or drop file here..."
            class="w-full h-40 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-sky-500/50 focus:border-sky-500/80 transition-all text-xs font-mono leading-relaxed scroll-container"
            oninput="updatePaperState('${paper.id}', 'text', this.value)"
          >${paper.text}</textarea>
          
          <!-- Drop Overlay helper inside textarea -->
          <div class="absolute right-3 bottom-3 flex items-center gap-1.5 pointer-events-none opacity-40 group-focus-within/zone:opacity-20 transition-all text-[10px] text-slate-400">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
            <span>Drop file here</span>
          </div>
        </div>

        <!-- Optional Metadata Dropdown -->
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button onclick="toggleMetadata('${paper.id}')" class="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer">
            <span class="flex items-center gap-1.5">
              <i data-lucide="database" class="w-3.5 h-3.5 text-indigo-400"></i>
              Study Metadata Fields (Optional)
            </span>
            <i id="meta-arrow-${paper.id}" data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform ${paper.metadataOpen ? 'rotate-180' : ''}"></i>
          </button>
          
          <div id="meta-content-${paper.id}" class="accordion-content p-3.5 border-t border-slate-200 space-y-2.5 ${paper.metadataOpen ? 'open' : ''}">
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Study Title</label>
                <input type="text" value="${paper.title}" placeholder="e.g. Clinical Trial..." class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500/60" oninput="updatePaperState('${paper.id}', 'title', this.value)">
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Authors</label>
                <input type="text" value="${paper.authors}" placeholder="e.g. Dr. Roberts..." class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500/60" oninput="updatePaperState('${paper.id}', 'authors', this.value)">
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-2.5">
              <div>
                <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pub Year</label>
                <input type="text" value="${paper.year}" placeholder="e.g. 2025" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500/60" oninput="updatePaperState('${paper.id}', 'year', this.value)">
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Journal</label>
                <input type="text" value="${paper.journal}" placeholder="e.g. Lancet" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500/60" oninput="updatePaperState('${paper.id}', 'journal', this.value)">
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Sample N</label>
                <input type="number" value="${paper.sampleSize}" placeholder="e.g. 250" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500/60" oninput="updatePaperState('${paper.id}', 'sampleSize', this.value)">
              </div>
            </div>
            
            <div>
              <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">DOI / Identifier</label>
              <input type="text" value="${paper.doi}" placeholder="e.g. 10.1016/..." class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500/60" oninput="updatePaperState('${paper.id}', 'doi', this.value)">
            </div>
          </div>
        </div>

      </div>
    `;
    
    papersListContainer.appendChild(card);
  });
  
  // Re-run lucide icons to parse new icons in card markup
  lucide.createIcons();
}

// -------------------------------------------------------------
// PRESETS AND TEMPLATE LOADER
// -------------------------------------------------------------
function loadPreset(key) {
  if (!PRESETS[key]) return;
  
  papers = [];
  PRESETS[key].forEach(p => {
    papers.push({ ...p, id: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` });
  });
  
  renderPapers();
  runFullAnalysisSilently();
}

// -------------------------------------------------------------
// TEXT EXTRACTOR & FILE DROP HANDLERS
// -------------------------------------------------------------
function handleFileImport(e) {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
}

function handleFiles(fileList) {
  Array.from(fileList).forEach(file => {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    if (fileExt === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        addPaperCard({
          title: fileName.replace('.txt', ''),
          text: event.target.result
        });
      };
      reader.readAsText(file);
    } 
    else if (fileExt === 'pdf') {
      // PDF text extraction using pdf.js
      const reader = new FileReader();
      reader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
          let maxPages = pdf.numPages;
          let countPromises = [];
          
          for (let j = 1; j <= maxPages; j++) {
            let pagePromise = pdf.getPage(j).then(page => {
              return page.getTextContent().then(textContent => {
                return textContent.items.map(item => item.str).join(' ');
              });
            });
            countPromises.push(pagePromise);
          }
          
          Promise.all(countPromises).then(pageTexts => {
            const fullText = pageTexts.join('\n\n');
            // Basic title extractor from name
            addPaperCard({
              title: fileName.replace('.pdf', ''),
              text: fullText,
              sampleSize: parseSampleSizeFromText(fullText)
            });
          });
        }).catch(err => {
          console.error("Error reading PDF:", err);
          alert("Error parsing PDF file client-side. Make sure it contains readable text.");
        });
      };
      reader.readAsArrayBuffer(file);
    } 
    else if (fileExt === 'docx') {
      // DOCX text extraction using JSZip and client-side XML parsing
      const reader = new FileReader();
      reader.onload = function(event) {
        JSZip.loadAsync(event.target.result).then(zip => {
          zip.file("word/document.xml").async("string").then(xmlString => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const paragraphs = xmlDoc.getElementsByTagName("w:t");
            let text = "";
            for (let i = 0; i < paragraphs.length; i++) {
              text += paragraphs[i].textContent + " ";
            }
            addPaperCard({
              title: fileName.replace('.docx', ''),
              text: text.trim(),
              sampleSize: parseSampleSizeFromText(text)
            });
          });
        }).catch(err => {
          console.error("Error reading DOCX:", err);
          alert("Could not load DOCX file. Make sure it is a valid format.");
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert(`Format .${fileExt} not supported. Please upload PDF, DOCX or TXT files.`);
    }
  });
}

function parseSampleSizeFromText(text) {
  const patterns = [
    /\bn\s*=\s*(\d+)\b/i,
    /\b(\d+)\s+(?:patients|participants|subjects|individuals|cases|volunteers|adults)\b/i,
    /cohort\s+of\s+(\d+)/i,
    /sample\s+size\s+(?:of\s+)?(\d+)/i
  ];
  for (let pattern of patterns) {
    const m = pattern.exec(text);
    if (m && m[1]) return m[1];
  }
  return '';
}

// -------------------------------------------------------------
// AI ANALYTICS ENGINE & SYNTHESIZER
// -------------------------------------------------------------
async function runFullAnalysis() {
  if (papers.length === 0) {
    alert("Please add at least one research paper to analyze.");
    return;
  }
  
  processingOverlay.classList.remove('hidden');
  loaderProgressBar.style.width = '10%';
  loaderDetailsText.textContent = "Connecting to Gemini AI Engine...";
  
  try {
    const text = papers.map(p => `Title: ${p.title}\nAuthors: ${p.authors}\nSample Size: ${p.sampleSize}\nText: ${p.text}`).join("\n\n");
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    loaderProgressBar.style.width = '60%';
    loaderDetailsText.textContent = "Synthesizing consensus and discrepancies...";

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    loaderProgressBar.style.width = '100%';
    loaderDetailsText.textContent = "Rendering results...";
    
    setTimeout(() => {
      processingOverlay.classList.add('hidden');
      executeSynthesis(data);
    }, 500);

  } catch (err) {
    console.error(err);
    alert("Failed to analyze with Gemini API. Make sure the backend is running and GEMINI_API_KEY is valid.");
    processingOverlay.classList.add('hidden');
  }
}

async function runFullAnalysisSilently() {
  if (papers.length > 0) {
    try {
      const text = papers.map(p => `Title: ${p.title}\nAuthors: ${p.authors}\nSample Size: ${p.sampleSize}\nText: ${p.text}`).join("\n\n");
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (response.ok) {
        const data = await response.json();
        executeSynthesis(data);
      }
    } catch (e) {
      console.error("Silent analysis failed", e);
    }
  }
}

// Main logic engine that compiles analytics
function executeSynthesis(data) {
  // Activate status bar
  aiStatusIndicator.classList.remove('hidden');
  aiStatusIndicator.classList.add('flex');
  aiStatusText.textContent = "Analysis Complete";
  
  // 1. Participant N extraction
  counterPapers.textContent = papers.length;
  counterCohort.textContent = (data.total_participants || 0).toLocaleString();
  
  // 2. Render Consensus Summary
  const consensusSummaryContainer = document.getElementById('consensus-summary-text');
  if (consensusSummaryContainer) {
    if (papers.length === 0 || !data.consensus_summary) {
      consensusSummaryContainer.innerHTML = `<span class="italic text-slate-500">No consensus points computed yet. Ensure studies are analyzed.</span>`;
    } else {
      consensusSummaryContainer.innerHTML = `<span class="font-medium text-slate-800">${data.consensus_summary}</span>`;
    }
  }

  // 3. Render Discrepancy Summary
  const discrepancySummaryContainer = document.getElementById('discrepancy-summary-text');
  if (discrepancySummaryContainer) {
    if (papers.length === 0 || !data.discrepancy_summary) {
      discrepancySummaryContainer.innerHTML = `<span class="italic text-slate-500">No conflicting parameters identified yet.</span>`;
    } else {
      discrepancySummaryContainer.innerHTML = `<span class="text-slate-800">${data.discrepancy_summary}</span>`;
    }
  }

  // 4. Render Limitations & Future
  const limitationsContainer = document.getElementById('limitations-future-text');
  if (limitationsContainer) {
    if (papers.length === 0 || !data.limitations_and_future) {
      limitationsContainer.innerHTML = `<span class="italic text-slate-500">No research papers analyzed yet. Run analysis to generate limitations and future directions.</span>`;
    } else {
      limitationsContainer.innerHTML = `<span class="text-slate-800">${data.limitations_and_future}</span>`;
    }
  }
  
  // Re-run lucide parser
  lucide.createIcons();
}

// Helper utilities for analysis
function getPaperCitation(paper, idx) {
  if (paper.authors && paper.year) {
    const firstAuthor = paper.authors.split(',')[0].trim();
    return `${firstAuthor} et al., ${paper.year}`;
  }
  return `Paper #${idx}`;
}

function setGaugeOffset(circleEl, percent) {
  if (!circleEl) return;
  // radius = 40, circumference = 2 * PI * r = 251.2
  const offset = 251.2 - (percent / 100) * 251.2;
  circleEl.style.strokeDashoffset = offset;
}

function filterUniquePoints(matches) {
  // Filters out sentences that are too similar or redundant
  const unique = [];
  const seen = new Set();
  
  matches.forEach(obj => {
    const words = obj.sentence.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    // basic signature
    const signature = words.slice(0, 4).join('_');
    if (!seen.has(signature) && unique.length < 5) {
      seen.add(signature);
      unique.push(obj);
    }
  });
  
  return unique;
}

function extractTopicClusters() {
  // Tokenize all paper words and extract the top medical terms
  const stopWords = new Set(['about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves', 'study', 'results', 'finding', 'group', 'trial', 'patients', 'effect', 'effects', 'evaluated', 'found', 'showed', 'participants', 'ingestion', 'associated', 'compared', 'assessed', 'levels', 'difference']);
  
  const counts = {};
  papers.forEach(p => {
    const text = (p.text || '').toLowerCase();
    const cleanTokens = text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    cleanTokens.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });
  
  const sorted = Object.keys(counts).map(key => {
    return { word: key.charAt(0).toUpperCase() + key.slice(1), count: counts[key] };
  }).sort((a, b) => b.count - a.count);
  
  // Return top 6 clusters
  return {
    clusters: sorted.slice(0, 6)
  };
}

function calculateSemanticSimilarity() {
  if (papers.length < 2) return 'N/A';
  // Jaccard similarity estimate on unique words
  let paperWordSets = papers.map(p => {
    const text = (p.text || '').toLowerCase();
    const words = text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 4);
    return new Set(words);
  });
  
  // Intersect all
  let intersection = new Set(paperWordSets[0]);
  let union = new Set(paperWordSets[0]);
  
  for (let i = 1; i < paperWordSets.length; i++) {
    const current = paperWordSets[i];
    
    // update intersection
    intersection = new Set([...intersection].filter(x => current.has(x)));
    
    // update union
    union = new Set([...union, ...current]);
  }
  
  if (union.size === 0) return 0;
  
  // Amplify similarity scale for high fidelity text profiles
  const score = Math.min(96, Math.floor((intersection.size / union.size) * 100) + 45);
  return isNaN(score) ? 0 : score;
}

function collectLimitations() {
  const list = [];
  papers.forEach((p, idx) => {
    const text = p.text || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/(?<=[.!?])\s+/);
    
    sentences.forEach(s => {
      const low = s.toLowerCase();
      if (low.includes('limitations') || low.includes('unregulated') || low.includes('bias') || low.includes('self-reported')) {
        let type = "Study Constraints";
        if (low.includes('sample size') || low.includes('small sample') || low.includes('n =')) {
          type = "Cohort Limitations";
        } else if (low.includes('self-reported')) {
          type = "Reporting Bias";
        } else if (low.includes('control') || low.includes('sun exposure')) {
          type = "Environmental Variables";
        }
        
        if (list.length < 6) {
          list.push({
            type,
            text: s.trim(),
            idx: idx + 1
          });
        }
      }
    });
  });
  return list;
}

// -------------------------------------------------------------
// DOWNLOAD SUMMARY & DATASET EXPORTS
// -------------------------------------------------------------
function downloadSummaryFile() {
  if (papers.length === 0) {
    alert("No summary data to download.");
    return;
  }
  
  let content = `====================================================\n`;
  content += ` AEGIS CLINICAL SUMMARY REPORT - ${new Date().toLocaleDateString()}\n`;
  content += `====================================================\n\n`;
  content += `INDIVIDUAL RESEARCH TAKEAWAYS:\n`;
  individualSummariesContainer.querySelectorAll('p').forEach((p, idx) => {
    content += `Paper #${idx+1} Point: ${p.textContent}\n`;
  });
  content += `\n`;
  content += `EVIDENCE METRICS:\n`;
  content += `- Total Publications: ${papers.length}\n`;
  content += `- Cumulative Subjects (N): ${counterCohort.textContent}\n`;
  content += `- Evidence Quality Grade: ${metricEvidenceScore.textContent}\n`;
  content += `- Global Bias Estimate: ${metricBiasScore.textContent}\n\n`;
  content += `CONSENSUS STATEMENTS:\n`;
  
  consensusDashboardList.querySelectorAll('li').forEach((li, idx) => {
    const p = li.querySelector('p').textContent;
    content += `[${idx+1}] ${p}\n`;
  });
  
  content += `\nCONFLICTING OBSERVATIONS:\n`;
  conflictsDashboardList.querySelectorAll('li').forEach((li, idx) => {
    const p = li.querySelector('p').textContent;
    content += `[${idx+1}] ${p}\n`;
  });

  content += `\nGenerated dynamically by AEGIS AI Aggregator Engine.\n`;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aegis_Clinical_Summary_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportDatasetFile() {
  if (papers.length === 0) {
    alert("No dataset to export.");
    return;
  }
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(papers, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `Aegis_Source_Dataset_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

// Boot the app
window.onload = init;
