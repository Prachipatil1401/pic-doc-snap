// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Box drawing characters
const box = {
  tl: '┌', tr: '┐', bl: '└', br: '┘',
  h: '─', v: '│', t: '┬', b: '┴', c: '┼',
  l: '├', r: '┤'
};

// Define 10 classes: Healthy and 9 different diseases
const classes = ["Healthy", "Disease1", "Disease2", "Disease3", "Disease4", "Disease5", "Disease6", "Disease7", "Disease8", "Disease9"];

// Generate mock data: 100 samples (10 per class) with realistic predictions
const mockData = [];
classes.forEach(trueLabel => {
  for (let i = 0; i < 10; i++) {
    // Most predictions are correct, but some are confused with similar classes
    let prediction = trueLabel;
    if (Math.random() < 0.2) { // 20% error rate
      const similarClasses = classes.filter(c => c !== trueLabel);
      prediction = similarClasses[Math.floor(Math.random() * similarClasses.length)];
    }
    mockData.push({ trueLabel, prediction });
  }
});

// Compute confusion matrix (10x10)
const computeConfusionMatrix = (data, classes) => {
  const matrix = Array.from({ length: classes.length }, () => Array(classes.length).fill(0));

  data.forEach(({ trueLabel, prediction }) => {
    const trueIndex = classes.indexOf(trueLabel);
    const predIndex = classes.indexOf(prediction);
    if (trueIndex !== -1 && predIndex !== -1) {
      matrix[trueIndex][predIndex]++;
    }
  });

  return matrix;
};

const confusionMatrix = computeConfusionMatrix(mockData, classes);

// Function to colorize cell based on value
const colorizeCell = (value, isDiagonal) => {
  if (isDiagonal) {
    return colors.green + colors.bright + value.toString().padStart(3) + colors.reset;
  } else if (value > 0) {
    return colors.red + value.toString().padStart(3) + colors.reset;
  } else {
    return colors.white + value.toString().padStart(3) + colors.reset;
  }
};

// Display confusion matrix in a box
console.log(colors.bright + colors.cyan + "Confusion Matrix for Plant Disease Detection (10 Classes)" + colors.reset);
console.log("");

// Calculate column widths
const colWidth = 5;
const labelWidth = 12;

// Top border
let topBorder = box.tl + box.h.repeat(labelWidth) + box.t;
classes.forEach(() => topBorder += box.h.repeat(colWidth) + box.t);
topBorder = topBorder.slice(0, -1) + box.tr;
console.log(topBorder);

// Header row
let header = box.v + "Predicted".padEnd(labelWidth) + box.v;
classes.forEach(cls => {
  header += cls.slice(0, colWidth - 1).padStart(colWidth - 1) + box.v;
});
console.log(header);

// Separator
let separator = box.l + box.h.repeat(labelWidth) + box.c;
classes.forEach(() => separator += box.h.repeat(colWidth) + box.c);
separator = separator.slice(0, -1) + box.r;
console.log(separator);

// Data rows
classes.forEach((trueClass, i) => {
  let row = box.v + trueClass.padEnd(labelWidth) + box.v;
  confusionMatrix[i].forEach((count, j) => {
    row += colorizeCell(count, i === j) + box.v;
  });
  console.log(row);
});

// Bottom border
let bottomBorder = box.bl + box.h.repeat(labelWidth) + box.b;
classes.forEach(() => bottomBorder += box.h.repeat(colWidth) + box.b);
bottomBorder = bottomBorder.slice(0, -1) + box.br;
console.log(bottomBorder);

// Calculate accuracy
const totalSamples = mockData.length;
const correctPredictions = confusionMatrix.reduce((sum, row, i) => sum + row[i], 0);
const accuracy = (correctPredictions / totalSamples * 100).toFixed(1);

console.log("");
console.log(colors.bright + colors.yellow + "Overall Accuracy: " + accuracy + "%" + colors.reset);
console.log(colors.bright + colors.yellow + "Total Samples: " + totalSamples + colors.reset);
console.log(colors.bright + colors.yellow + "Correct Predictions: " + correctPredictions + colors.reset);
