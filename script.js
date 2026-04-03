// Sorting Array Visualizer Script

// Global variables
let array = [];
let isSorting = false;
let isPaused = false;
let currentAlgorithm = 'bubble';
let speed = 50; // ms delay
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let animationId = null;
let stepMode = false;
let generator = null;
let comparisonData = [];

// Algorithm explanations
const explanations = {
    bubble: "Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted. It gets its name because smaller elements 'bubble' to the top of the list.",
    insertion: "Insertion Sort builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms. It works by taking elements from the list one by one and inserting them in their correct position into a new sorted list.",
    merge: "Merge Sort is a divide and conquer algorithm. It divides the input array into two halves, calls itself for the two halves, and then merges the two sorted halves. The merge() function is used for merging two halves. It is efficient and stable.",
    quick: "Quick Sort is a divide and conquer algorithm. It picks an element as pivot and partitions the given array around the picked pivot. There are many different versions of quicksort that pick pivot in different ways. It is generally faster than other O(n log n) algorithms."
};

// Algorithm details for diagram and pseudocode
const algorithmDetails = {
    bubble: {
        diagram: "[5,3,8,1] -> [3,5,1,8] -> [3,1,5,8] -> [1,3,5,8]",
        pseudocode: `for i = 0 to n-2\n    for j = 0 to n-i-2\n        if arr[j] > arr[j+1]\n            swap(arr[j], arr[j+1])`
    },
    insertion: {
        diagram: "[5,3,8,1] insert 3 -> [3,5,8,1] insert 8 -> [3,5,8,1] insert 1 -> [1,3,5,8]",
        pseudocode: `for i = 1 to n-1\n    key = arr[i]\n    j = i-1\n    while j >= 0 and arr[j] > key\n        arr[j+1] = arr[j]\n        j = j-1\n    arr[j+1] = key`
    },
    merge: {
        diagram: "[5,3,8,1] -> [5,3] + [8,1] -> [3,5] + [1,8] -> [1,3,5,8]",
        pseudocode: `mergeSort(arr, l, r)\n    if l < r\n        m = (l+r)/2\n        mergeSort(arr, l, m)\n        mergeSort(arr, m+1, r)\n        merge(arr, l, m, r)`
    },
    quick: {
        diagram: "[5,3,8,1] pivot=1 -> [1,3,8,5] -> [1,3,5,8]",
        pseudocode: `quickSort(arr, low, high)\n    if low < high\n        pi = partition(arr, low, high)\n        quickSort(arr, low, pi-1)\n        quickSort(arr, pi+1, high)`
    }
};

const stepAnnotations = {
    bubble: [
        "Comparing adjacent elements...",
        "Swap detected, moving values...",
        "Traversing list for next pass..."
    ],
    insertion: [
        "Taking key element and comparing leftward...",
        "Shifting larger elements...",
        "Inserting element at correct position..."
    ],
    merge: [
        "Dividing array into subarrays...",
        "Merging sorted subarrays...",
        "Subarray merge completed..."
    ],
    quick: [
        "Selecting pivot...",
        "Partitioning around pivot...",
        "Recursive call on subarrays..."
    ]
};

let sortStep = 0;


// DOM elements
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const algorithmSelect = document.getElementById('algorithm-select');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const speedSlider = document.getElementById('speed-slider');
const stepBtn = document.getElementById('step-btn');
const arrayInput = document.getElementById('array-input');
const generateRandomBtn = document.getElementById('generate-random');
const timeSpan = document.getElementById('time');
const comparisonsSpan = document.getElementById('comparisons');
const swapsSpan = document.getElementById('swaps');
const comparisonDiv = document.getElementById('comparison');
const comparisonTableBody = document.getElementById('comparison-table').querySelector('tbody');
const toggleMoreBtn = document.getElementById('toggle-more');
const extendedInfo = document.getElementById('extended-info');
const diagramDiv = document.getElementById('diagram');
const pseudocodePre = document.getElementById('pseudocode');
const syncStepText = document.getElementById('sync-step');

// Initialize
function init() {
    generateRandomArray();
    drawArray();
    updateExplanation();
    setupEventListeners();
}

function setupEventListeners() {
    algorithmSelect.addEventListener('change', () => {
        currentAlgorithm = algorithmSelect.value;
        updateExplanation();
    });
    startBtn.addEventListener('click', startSorting);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', reset);
    speedSlider.addEventListener('input', () => {
        speed = 101 - speedSlider.value; // Invert so higher value = faster
    });
    stepBtn.addEventListener('click', stepSort);
    document.getElementById('step-mode').addEventListener('change', (e) => {
        stepMode = e.target.checked;
        stepBtn.disabled = !stepMode || !isSorting;
        pauseBtn.disabled = stepMode; // no pause for step mode
    });
    toggleMoreBtn.addEventListener('click', () => {
        extendedInfo.classList.toggle('hidden');
        toggleMoreBtn.textContent = extendedInfo.classList.contains('hidden') ? 'See More' : 'See Less';
    });
    generateRandomBtn.addEventListener('click', () => {
        generateRandomArray();
        drawArray();
        resetMetrics();
    });
    arrayInput.addEventListener('change', () => {
        const input = arrayInput.value.trim();
        if (input) {
            const parsed = parseArrayInput(input);
            if (parsed) {
                array = parsed;
                drawArray();
                resetMetrics();
            }
        }
    });
}

function updateExplanation() {
    const text = explanations[currentAlgorithm];
    document.getElementById('explanation-text').textContent = text;

    const details = algorithmDetails[currentAlgorithm];
    diagramDiv.textContent = details.diagram;
    pseudocodePre.textContent = details.pseudocode;
    sortStep = 0;
    updateSyncStep();
}

function generateRandomArray(size = 50) {
    array = [];
    for (let i = 0; i < size; i++) {
        array.push(Math.floor(Math.random() * 100) + 1);
    }
}

function parseArrayInput(input) {
    try {
        const nums = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (nums.length > 0 && nums.length <= 100) {
            return nums;
        }
    } catch (e) {}
    alert('Invalid array input. Please enter comma-separated numbers.');
    return null;
}

function drawArray(highlights = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / array.length;
    const maxVal = Math.max(...array);
    array.forEach((val, idx) => {
        const barHeight = (val / maxVal) * canvas.height;
        const x = idx * barWidth;
        const y = canvas.height - barHeight;
        ctx.fillStyle = highlights.includes(idx) ? '#ff0000' : '#007bff';
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
}

function resetMetrics() {
    comparisons = 0;
    swaps = 0;
    timeSpan.textContent = '0';
    comparisonsSpan.textContent = '0';
    swapsSpan.textContent = '0';
}

function startSorting() {
    if (isSorting) return;
    isSorting = true;
    isPaused = false;
    startTime = Date.now();
    resetMetrics();
    startBtn.disabled = true;
    pauseBtn.disabled = !stepMode; // Disable pause in step mode
    stepBtn.disabled = !stepMode;
    generator = getSortingGenerator(currentAlgorithm);
    if (!stepMode) {
        animateSorting(generator);
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) {
        // Resume animation
    }
}

function reset() {
    isSorting = false;
    isPaused = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stepBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    resetMetrics();
    drawArray();
    generator = null;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function stepSort() {
    if (generator && isSorting) {
        const { value, done } = generator.next();
        if (done) {
            finishSorting();
        } else if (value) {
            sortStep++;
            drawArray(value.highlights || []);
            updateMetrics();
            updateSyncStep();
        }
    }
}

function animateSorting(generator) {
    function animate() {
        if (!isSorting || isPaused) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        const { value, done } = generator.next();
        if (done) {
            finishSorting();
            return;
        }
        if (value) {
            sortStep++;
            drawArray(value.highlights || []);
            updateMetrics();
            updateSyncStep();
        }
        setTimeout(() => {
            animationId = requestAnimationFrame(animate);
        }, speed);
    }
    animationId = requestAnimationFrame(animate);
}

function finishSorting() {
    isSorting = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stepBtn.disabled = true;
    drawArray();
    updateMetrics();
    syncStepText.textContent = 'Sorting completed';
    generator = null;
    addToComparison();
}

function updateMetrics() {
    timeSpan.textContent = Date.now() - startTime;
    comparisonsSpan.textContent = comparisons;
    swapsSpan.textContent = swaps;
}

function updateSyncStep() {
    const annotationList = stepAnnotations[currentAlgorithm] || [];
    const text = annotationList[sortStep % annotationList.length] || 'Executing step...';
    syncStepText.textContent = `Step ${sortStep + 1}: ${text}`;
}

function addToComparison() {
    const data = {
        algorithm: algorithmSelect.options[algorithmSelect.selectedIndex].text,
        time: parseInt(timeSpan.textContent),
        comparisons: comparisons,
        swaps: swaps
    };
    comparisonData.push(data);
    updateComparisonTable();
    comparisonDiv.style.display = 'block';
}

function updateComparisonTable() {
    comparisonTableBody.innerHTML = '';
    comparisonData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.algorithm}</td>
            <td>${data.time}</td>
            <td>${data.comparisons}</td>
            <td>${data.swaps}</td>
        `;
        comparisonTableBody.appendChild(row);
    });
}

function getSortingGenerator(algorithm) {
    switch (algorithm) {
        case 'bubble':
            return bubbleSortGenerator();
        case 'insertion':
            return insertionSortGenerator();
        case 'merge':
            return mergeSortGenerator();
        case 'quick':
            return quickSortGenerator();
        default:
            return bubbleSortGenerator();
    }
}

// Sorting Generators
function* bubbleSortGenerator() {
    const arr = [...array];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swaps++;
                array = [...arr];
                yield { highlights: [j, j + 1] };
            }
        }
    }
}

function* insertionSortGenerator() {
    const arr = [...array];
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            comparisons++;
            arr[j + 1] = arr[j];
            j--;
            swaps++;
        }
        arr[j + 1] = key;
        array = [...arr];
        yield { highlights: [j + 1, i] };
    }
}

function* mergeSortGenerator() {
    // Simplified, recursive merge sort with yields
    const arr = [...array];
    yield* mergeSort(arr, 0, arr.length - 1);
    array = arr;
}

function* mergeSort(arr, left, right) {
    if (left < right) {
        const mid = Math.floor((left + right) / 2);
        yield* mergeSort(arr, left, mid);
        yield* mergeSort(arr, mid + 1, right);
        yield* merge(arr, left, mid, right);
    }
}

function* merge(arr, left, mid, right) {
    const n1 = mid - left + 1;
    const n2 = right - mid;
    const L = arr.slice(left, mid + 1);
    const R = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        comparisons++;
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
        yield { highlights: [k - 1] };
    }
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
        yield { highlights: [k - 1] };
    }
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
        yield { highlights: [k - 1] };
    }
}

function* quickSortGenerator() {
    const arr = [...array];
    yield* quickSort(arr, 0, arr.length - 1);
    array = arr;
}

function* quickSort(arr, low, high) {
    if (low < high) {
        const pi = yield* partition(arr, low, high);
        yield* quickSort(arr, low, pi - 1);
        yield* quickSort(arr, pi + 1, high);
    }
}

function* partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        comparisons++;
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swaps++;
            yield { highlights: [i, j] };
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    swaps++;
    yield { highlights: [i + 1, high] };
    return i + 1;
}

// Initialize on load
init();