/**
 * PDF Slide Deck Parsing & Sample Data Provider
 */

// Initialize pdf.js worker if available
if (typeof window !== 'undefined' && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export async function parsePdfFile(file, globalSlideOffset = 0) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        const typedArray = new Uint8Array(event.target.result);
        const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        
        const slides = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const rawText = textContent.items.map(item => item.str.normalize("NFKC")).join(" ");
          const lines = textContent.items
            .map(item => item.str.trim())
            .filter(str => str.length > 0);

          const title = lines.length > 0 ? lines[0] : `Slide ${i}`;
          const bodyLines = lines.length > 1 ? lines.slice(1) : [];
          
          const bullets = bodyLines.filter(l => l.startsWith("-") || l.startsWith("•") || l.startsWith("*") || /^\d+\./.test(l));
          const codeSnippets = bodyLines.filter(l => /[{}=><();#]|def |class |import |function|const |let /.test(l));

          slides.push({
            slide_number: globalSlideOffset + i,
            page_in_file: i,
            source_file: file.name,
            title: title,
            body: bodyLines.join("\n"),
            bullets: bullets,
            code_snippets: codeSnippets,
            tables: [],
            word_count: rawText.split(/\s+/).length,
            raw_text: rawText
          });
        }
        resolve(slides);
      } catch (error) {
        console.error("PDF Parsing error:", error);
        reject(error);
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseMultiplePdfFiles(files) {
  const fileArray = Array.from(files);
  let allSlides = [];
  let currentOffset = 0;

  for (const file of fileArray) {
    const fileSlides = await parsePdfFile(file, currentOffset);
    allSlides = allSlides.concat(fileSlides);
    currentOffset += fileSlides.length;
  }

  return allSlides;
}

/**
 * Sample Demo Course Decks for instant 1-click testing
 */
export const SAMPLE_DECKS = {
  neural_nets: {
    title: "Deep Learning & Neural Network Architectures",
    slides: [
      {
        slide_number: 1,
        title: "Lecture 1: Foundations of Deep Learning",
        body: "Introduction to Artificial Neural Networks (ANN)\nDeep Learning is a subfield of Machine Learning based on artificial neural networks with representation learning.\nKey advantage: Automatic feature extraction from high-dimensional data.",
        bullets: ["• Machine Learning vs Deep Learning", "• Feature extraction automation", "• Perceptrons and biological neural inspirations"],
        code_snippets: ["import torch", "import torch.nn as nn"],
        raw_text: "Lecture 1: Foundations of Deep Learning\nIntroduction to Artificial Neural Networks (ANN)\nDeep Learning is a subfield of Machine Learning based on artificial neural networks with representation learning.\nKey advantage: Automatic feature extraction from high-dimensional data."
      },
      {
        slide_number: 2,
        title: "Perceptron & Forward Propagation",
        body: "Mathematical Formulation:\nz = w1*x1 + w2*x2 + ... + wn*xn + b = W^T * X + b\ny_hat = Activation(z)\nActivation Functions map linear combinations to non-linear spaces.",
        bullets: ["• Linear Combination: z = W^T * X + b", "• Non-linear Activation Function mapping", "• Output computation step-by-step"],
        code_snippets: ["z = np.dot(w, x) + b", "output = sigmoid(z)"],
        raw_text: "Perceptron & Forward Propagation\nMathematical Formulation:\nz = w1*x1 + w2*x2 + ... + wn*xn + b = W^T * X + b\ny_hat = Activation(z)\nActivation Functions map linear combinations to non-linear spaces."
      },
      {
        slide_number: 3,
        title: "Common Activation Functions",
        body: "ReLU (Rectified Linear Unit): f(x) = max(0, x). Most popular for hidden layers.\nSigmoid: S-shaped curve scaling values between [0, 1]. Used for binary classification.\nSoftmax: Multi-class probability distribution scaling.",
        bullets: ["• ReLU: max(0, x)", "• Sigmoid: 1 / (1 + exp(-x))", "• Softmax: exp(z_i) / sum(exp(z_j))"],
        code_snippets: ["def relu(x):\n    return np.maximum(0, x)", "def sigmoid(x):\n    return 1 / (1 + np.exp(-x))"],
        raw_text: "Common Activation Functions\nReLU (Rectified Linear Unit): f(x) = max(0, x). Most popular for hidden layers.\nSigmoid: S-shaped curve scaling values between [0, 1]. Used for binary classification.\nSoftmax: Multi-class probability distribution scaling."
      },
      {
        slide_number: 4,
        title: "Loss Functions & Optimization",
        body: "Mean Squared Error (MSE): L = 1/N * sum((y - y_hat)^2) for regression.\nCross-Entropy Loss: L = -sum(y * log(y_hat)) for classification.\nGradient Descent: Update weights via w = w - alpha * dL/dw.",
        bullets: ["• Loss measurement between prediction and target", "• Cross-Entropy Loss for classification tasks", "• Gradient Descent optimization step"],
        code_snippets: ["optimizer = torch.optim.Adam(model.parameters(), lr=0.001)", "loss.backward()"],
        raw_text: "Loss Functions & Optimization\nMean Squared Error (MSE): L = 1/N * sum((y - y_hat)^2) for regression.\nCross-Entropy Loss: L = -sum(y * log(y_hat)) for classification.\nGradient Descent: Update weights via w = w - alpha * dL/dw."
      },
      {
        slide_number: 5,
        title: "Backpropagation Algorithm",
        body: "Chain Rule of Calculus: dL/dw = (dL/dy_hat) * (dy_hat/dz) * (dz/dw).\nPass 1: Forward pass computes loss.\nPass 2: Backward pass propagates gradients from output to input layers.",
        bullets: ["• Chain Rule of differentiation", "• Forward pass vs Backward gradient pass", "• Weight update iterations"],
        code_snippets: ["# PyTorch automatic differentiation", "loss.backward()", "optimizer.step()"],
        raw_text: "Backpropagation Algorithm\nChain Rule of Calculus: dL/dw = (dL/dy_hat) * (dy_hat/dz) * (dz/dw).\nPass 1: Forward pass computes loss.\nPass 2: Backward pass propagates gradients from output to input layers."
      }
    ]
  },
  db_systems: {
    title: "Database Systems & Query Optimization",
    slides: [
      {
        slide_number: 1,
        title: "Relational Algebra & SQL Execution",
        body: "Relational Model: Data organized in relations (tables), tuples (rows), and attributes (columns).\nKey Operations: Selection (σ), Projection (π), Join (⋈), Union (∪).",
        bullets: ["• Relational schema definitions", "• Relational algebra operators", "• SQL query transformation pipeline"],
        code_snippets: ["SELECT name, department FROM employees WHERE salary > 80000;"],
        raw_text: "Relational Algebra & SQL Execution\nRelational Model: Data organized in relations (tables), tuples (rows), and attributes (columns).\nKey Operations: Selection (σ), Projection (π), Join (⋈), Union (∪)."
      },
      {
        slide_number: 2,
        title: "Indexing & B+ Trees",
        body: "B+ Tree Index: Self-balancing search tree keeping data sorted for O(log N) lookups.\nClustered Index: Determines physical order of data on disk.\nNon-Clustered Index: Points to record locators.",
        bullets: ["• B+ Tree height and fanout", "• Clustered vs Secondary indexes", "• Range query optimization"],
        code_snippets: ["CREATE INDEX idx_emp_salary ON employees(salary);"],
        raw_text: "Indexing & B+ Trees\nB+ Tree Index: Self-balancing search tree keeping data sorted for O(log N) lookups.\nClustered Index: Determines physical order of data on disk.\nNon-Clustered Index: Points to record locators."
      },
      {
        slide_number: 3,
        title: "ACID Properties & Transactions",
        body: "Atomicity: All-or-nothing execution.\nConsistency: Maintains database invariants.\nIsolation: Concurrent transactions execute independently.\nDurability: Committed changes survive crashes.",
        bullets: ["• ACID transaction guarantees", "• Two-Phase Locking (2PL)", "• Write-Ahead Logging (WAL)"],
        code_snippets: ["BEGIN TRANSACTION;", "UPDATE accounts SET balance = balance - 100 WHERE id = 1;", "COMMIT;"],
        raw_text: "ACID Properties & Transactions\nAtomicity: All-or-nothing execution.\nConsistency: Maintains database invariants.\nIsolation: Concurrent transactions execute independently.\nDurability: Committed changes survive crashes."
      }
    ]
  }
};
