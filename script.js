document.addEventListener('DOMContentLoaded', () => {

    const ALGO_CODE = {
        bubbleSort: ["function BubbleSort(arr):", "  n = arr.length", "  for i from 0 to n-2:", "    for j from 0 to n-i-2:", "      if arr[j] > arr[j+1]:", "        swap(arr[j], arr[j+1])", "  return arr"],
        selectionSort: ["function SelectionSort(arr):", "  n = arr.length", "  for i from 0 to n-2:", "    minIndex = i", "    for j from i+1 to n-1:", "      if arr[j] < arr[minIndex]:", "        minIndex = j", "    swap(arr[i], arr[minIndex])", "  return arr"],
        insertionSort: ["function InsertionSort(arr):", "  for i from 1 to n-1:", "    key = arr[i]", "    j = i - 1", "    while j >= 0 and arr[j] > key:", "      arr[j+1] = arr[j]", "      j = j - 1", "    arr[j+1] = key", "  return arr"],
        mergeSort: ["function MergeSort(arr, l, r):", "  if l >= r: return", "  m = (l+r)/2", "  MergeSort(arr, l, m)", "  MergeSort(arr, m+1, r)", "  merge(arr, l, m, r)"],
        quickSort: ["function QuickSort(arr, low, high):", "  if low < high:", "    pivot_idx = partition(arr, low, high)", "    QuickSort(arr, low, pivot_idx - 1)", "    QuickSort(arr, pivot_idx + 1, high)"],
        heapSort: ["function HeapSort(arr):", "  buildMaxHeap(arr)", "  for i from n-1 down to 1:", "    swap(arr[0], arr[i])", "    heapify(arr, i, 0)"],
        shellSort: ["function ShellSort(arr):", "  n = arr.length", "  for gap from n/2 down to 1:", "    for i from gap to n-1:", "      // Perform gapped insertion sort", "      ..."],
        introSort: ["function IntroSort(arr, depth):", "  if size <= 16: InsertionSort()", "  else if depth == 0: HeapSort()", "  else:", "    pivot = partition(arr)", "    IntroSort(left, depth-1)", "    IntroSort(right, depth-1)"],
        timSort: ["function TimSort(arr):", "  for each run of size 32:", "    InsertionSort(run)", "  for size from 32 up to n:", "    merge adjacent runs", "    ..."],
    };
    function generateNearlySorted(size) { const arr = Array.from({ length: size }, (_, i) => i); const swaps = Math.floor(size / 5) || 1; for (let i = 0; i < swaps; i++) { const r1 = Math.floor(Math.random() * size); const r2 = Math.floor(Math.random() * size); [arr[r1], arr[r2]] = [arr[r2], arr[r1]]; } return arr; }
    function generateReversed(size) { return Array.from({ length: size }, (_, i) => size - 1 - i); }
    function generateFewUnique(size) { const uc = Math.max(2, Math.floor(size / 4)); const uv = Array.from({ length: uc }, () => Math.floor(Math.random() * size * 2)); const arr = []; for (let i = 0; i < size; i++) { arr.push(uv[Math.floor(Math.random() * uc)]); } return arr; }

    class QuickSortController {
        constructor(initialArray) { this.arr = [...initialArray]; this.steps = []; this.state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 }; this.callStack = [{ low: 0, high: this.arr.length - 1, parentId: 0 }]; this.phase = 'START'; this.partitionState = {}; }
        nextStep() {
            if (this.phase === 'PAUSED' || this.phase === 'DONE') return null;
            if (this.phase === 'START') { this.phase = 'PARTITION'; return this.pushStep({ type: 'start', lineOfCode: 1 }, null); }
            if (this.phase === 'PARTITION') {
                if (this.callStack.length === 0) { this.phase = 'DONE'; return this.pushStep({ type: 'end' }, this.steps[this.steps.length - 1].id ); }
                const { low, high, parentId } = this.callStack.pop(); this.partitionState = { low, high, i: low - 1, j: low, parentId };
                if (low >= high) { return this.nextStep(); }
                this.phase = 'AWAIT_PIVOT'; const awaitStep = this.pushStep({ type: 'await-pivot', indices: [low, high], lineOfCode: 3 }, parentId); this.partitionState.awaitNodeId = awaitStep.id; return awaitStep;
            }
            if (this.phase === 'COMPARE') {
                const { low, high, i, j, pivotValue, awaitNodeId } = this.partitionState;
                if (j >= high) {
                    this.state.swapCount++; [this.arr[i + 1], this.arr[high]] = [this.arr[high], this.arr[i + 1]];
                    const p = i + 1; const finalSwapStep = this.pushStep({ type: 'pivot-swap', indices: [p, high], lineOfCode: 3 }, awaitNodeId);
                    this.callStack.push({ low: p + 1, high: high, parentId: finalSwapStep.id }); this.callStack.push({ low: low, high: p - 1, parentId: finalSwapStep.id });
                    this.phase = 'PARTITION'; return this.nextStep();
                }
                this.state.comparisonCount++; this.pushStep({ type: 'compare', indices: [j, high], lineOfCode: 3 }, awaitNodeId);
                if (this.arr[j] < pivotValue) {
                    this.partitionState.i++; this.state.swapCount++; [this.arr[this.partitionState.i], this.arr[j]] = [this.arr[j], this.arr[this.partitionState.i]];
                    this.pushStep({ type: 'swap', indices: [this.partitionState.i, j], lineOfCode: 3 }, awaitNodeId);
                }
                this.partitionState.j++; return this.steps[this.steps.length - 1];
            }
            return null;
        }
        setPivotAndContinue(pivotIndex) {
            if (this.phase !== 'AWAIT_PIVOT') return; const { high, awaitNodeId } = this.partitionState;
            [this.arr[pivotIndex], this.arr[high]] = [this.arr[high], this.arr[pivotIndex]]; this.partitionState.pivotValue = this.arr[high];
            this.pushStep({ type: 'set-pivot', indices: [pivotIndex, high], arrayState: [...this.arr], lineOfCode: 3 }, awaitNodeId); this.phase = 'COMPARE';
        }
        pushStep(stepData, parentId) { const step = { id: this.state.stepCounter++, parentId: parentId, arrayState: [...this.arr], comparisonCount: this.state.comparisonCount, swapCount: this.state.swapCount, ...stepData }; this.steps.push(step); return step; }
    }

    function getBubbleSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; let state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 }; let lastStepId = null;
        const push = (data) => { data.id = state.stepCounter++; data.parentId = lastStepId; steps.push(data); lastStepId = data.id; };
        push({ type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        for (let i = 0; i < arr.length - 1; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                state.comparisonCount++; push({ type: 'compare', indices: [j, j + 1], arrayState: [...arr], ...state, lineOfCode: 5 });
                if (arr[j] > arr[j + 1]) { state.swapCount++; [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; push({ type: 'swap', indices: [j, j + 1], arrayState: [...arr], ...state, lineOfCode: 6 }); }
            }
        }
        push({ type: 'end', arrayState: [...arr], ...state, lineOfCode: 7 }); return steps;
    }
    function getSelectionSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; let state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 }; let lastStepId = null;
        const push = (data) => { data.id = state.stepCounter++; data.parentId = lastStepId; steps.push(data); lastStepId = data.id; };
        push({ type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        for (let i = 0; i < arr.length - 1; i++) {
            let minIndex = i;
            for (let j = i + 1; j < arr.length; j++) {
                state.comparisonCount++; push({ type: 'compare', indices: [j, minIndex], arrayState: [...arr], ...state, lineOfCode: 6 });
                if (arr[j] < arr[minIndex]) minIndex = j;
            }
            if (minIndex !== i) { state.swapCount++; [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]]; push({ type: 'swap', indices: [i, minIndex], arrayState: [...arr], ...state, lineOfCode: 8 }); }
        }
        push({ type: 'end', arrayState: [...arr], ...state, lineOfCode: 9 }); return steps;
    }
    function getInsertionSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; let state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 }; let lastStepId = null;
        const push = (data) => { data.id = state.stepCounter++; data.parentId = lastStepId; steps.push(data); lastStepId = data.id; };
        push({ type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        for (let i = 1; i < arr.length; i++) {
            let key = arr[i], j = i - 1;
            while (j >= 0) {
                state.comparisonCount++; push({ type: 'compare', indices: [j, i], arrayState: [...arr], ...state, lineOfCode: 5 });
                if (arr[j] > key) { state.swapCount++; arr[j + 1] = arr[j--]; } else { break; }
            }
            arr[j + 1] = key;
        }
        push({ type: 'end', arrayState: [...arr], ...state, lineOfCode: 9 }); return steps;
    }
    function getShellSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; const state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 };
        steps.push({ id: state.stepCounter++, parentId: null, type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
            const parentId = state.stepCounter-1;
            steps.push({ id: state.stepCounter++, parentId: parentId, type: `gap-phase: ${gap}`, arrayState: [...arr], ...state, lineOfCode: 3 });
            for (let i = gap; i < arr.length; i++) {
                let temp = arr[i], j;
                for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                    state.comparisonCount++; state.swapCount++; arr[j] = arr[j - gap];
                }
                arr[j] = temp;
            }
        }
        steps.push({ id: state.stepCounter++, parentId: state.stepCounter-2, type: 'end', arrayState: [...arr], ...state }); return steps;
    }
    function getHeapSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; const state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 };
        steps.push({ id: state.stepCounter++, parentId: null, type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        const buildHeapNodeId = state.stepCounter;
        steps.push({ id: state.stepCounter++, parentId: 0, type: 'build-heap', arrayState: [...arr], ...state, lineOfCode: 2 });
        for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) { heapify(arr, arr.length, i, steps, state, buildHeapNodeId); }
        const extractNodeId = state.stepCounter;
        steps.push({ id: state.stepCounter++, parentId: 0, type: 'extract-phase', arrayState: [...arr], ...state, lineOfCode: 3 });
        for (let i = arr.length - 1; i > 0; i--) {
            state.swapCount++; [arr[0], arr[i]] = [arr[i], arr[0]];
            steps.push({ id: state.stepCounter++, parentId: extractNodeId, type: 'extract-swap', indices: [0, i], arrayState: [...arr], ...state, lineOfCode: 4 });
            heapify(arr, i, 0, steps, state, extractNodeId);
        }
        steps.push({ id: state.stepCounter++, parentId: extractNodeId, type: 'end', arrayState: [...arr], ...state }); return steps;
    }
    function heapify(arr, n, i, steps, state, parentId) {
        let largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n) { state.comparisonCount++; if (arr[l] > arr[largest]) largest = l; }
        if (r < n) { state.comparisonCount++; if (arr[r] > arr[largest]) largest = r; }
        if (largest !== i) {
            state.swapCount++; [arr[i], arr[largest]] = [arr[largest], arr[i]];
            steps.push({ id: state.stepCounter++, parentId: parentId, type: 'heap-swap', indices: [i, largest], arrayState: [...arr], ...state, lineOfCode: 4 });
            heapify(arr, n, largest, steps, state, parentId);
        }
    }
    function getMergeSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; const state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 };
        steps.push({ id: state.stepCounter++, parentId: null, type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        recursiveMergeSort(arr, 0, arr.length - 1, steps, state, 0);
        steps.push({ id: state.stepCounter++, parentId: state.stepCounter-2, type: 'end', arrayState: [...arr], ...state }); return steps;
    }
    function recursiveMergeSort(arr, l, r, steps, state, parentId) {
        if (l >= r) { return; }
        const m = l + Math.floor((r - l) / 2); const splitNodeId = state.stepCounter;
        steps.push({ id: state.stepCounter++, parentId, type: 'split', indices: [l, r], arrayState: [...arr], ...state, lineOfCode: 3 });
        recursiveMergeSort(arr, l, m, steps, state, splitNodeId);
        recursiveMergeSort(arr, m + 1, r, steps, state, splitNodeId);
        merge(arr, l, m, r, steps, state, splitNodeId);
    }
    function merge(arr, l, m, r, steps, state, parentId) {
        const n1 = m - l + 1, n2 = r - m; const L = new Array(n1), R = new Array(n2);
        for (let i = 0; i < n1; i++) L[i] = arr[l + i]; for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
        let i = 0, j = 0, k = l;
        while (i < n1 && j < n2) {
            state.comparisonCount++;
            if (L[i] <= R[j]) { arr[k] = L[i++]; } else { arr[k] = R[j++]; }
            state.swapCount++; k++;
        }
        while (i < n1) { arr[k++] = L[i++]; state.swapCount++; } while (j < n2) { arr[k++] = R[j++]; state.swapCount++; }
        steps.push({ id: state.stepCounter++, parentId: parentId, type: 'merge-done', indices: [l, r], arrayState: [...arr], ...state, lineOfCode: 6 });
    }
    function getQuickSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; const state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 };
        steps.push({ id: state.stepCounter++, parentId: null, type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        recursiveQuickSort(arr, 0, arr.length - 1, steps, state, 0);
        steps.push({ id: state.stepCounter++, parentId: state.stepCounter-2, type: 'end', arrayState: [...arr], ...state }); return steps;
    }
    function recursiveQuickSort(arr, low, high, steps, state, parentId) {
        if (low < high) {
            let pivot = arr[high], i = low - 1; const pNodeId = state.stepCounter;
            steps.push({ id: state.stepCounter++, parentId: parentId, type: 'partition', indices: [low, high], arrayState: [...arr], ...state, lineOfCode: 3 });
            for (let j = low; j < high; j++) {
                state.comparisonCount++;
                if (arr[j] < pivot) { i++; state.swapCount++;[arr[i], arr[j]] = [arr[j], arr[i]]; }
            }
            state.swapCount++; [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]; const p = i + 1;
            recursiveQuickSort(arr, low, p - 1, steps, state, pNodeId);
            recursiveQuickSort(arr, p + 1, high, steps, state, pNodeId);
        }
    }
    function getIntroSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; const state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 };
        const depthLimit = 2 * Math.floor(Math.log2(arr.length));
        steps.push({ id: state.stepCounter++, parentId: null, type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        introsortUtil(arr, 0, arr.length - 1, depthLimit, steps, state, 0);
        steps.push({ id: state.stepCounter++, parentId: state.stepCounter-2, type: 'end', arrayState: [...arr], ...state }); return steps;
    }
    function introsortUtil(arr, begin, end, depthLimit, steps, state, parentId) {
        const size = end - begin + 1;
        if (size <= 16) {
            steps.push({ id: state.stepCounter++, parentId, type: 'switch-insertion', arrayState: [...arr], ...state, lineOfCode: 2 });
            for (let i = begin + 1; i <= end; i++) { let key = arr[i], j = i - 1; while (j >= begin && arr[j] > key) { state.comparisonCount++; state.swapCount++; arr[j + 1] = arr[j--]; } arr[j + 1] = key; } return;
        }
        if (depthLimit === 0) {
            steps.push({ id: state.stepCounter++, parentId, type: 'switch-heap', arrayState: [...arr], ...state, lineOfCode: 3 });
            const n = end - begin + 1;
            for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr.slice(begin), n, i, [], { ...state }, 0);
            for (let i = n - 1; i > 0; i--) { state.swapCount++; [arr[begin], arr[begin + i]] = [arr[begin + i], arr[begin]]; heapify(arr.slice(begin), i, 0, [], { ...state }, 0); } return;
        }
        let pivot = arr[end], i = begin - 1; const pNodeId = state.stepCounter;
        steps.push({ id: state.stepCounter++, parentId, type: 'partition', arrayState: [...arr], ...state, lineOfCode: 5 });
        for (let j = begin; j < end; j++) { if (arr[j] < pivot) { i++; state.swapCount++; [arr[i], arr[j]] = [arr[j], arr[i]]; } }
        state.swapCount++; [arr[i + 1], arr[end]] = [arr[end], arr[i + 1]]; const p = i + 1;
        introsortUtil(arr, begin, p - 1, depthLimit - 1, steps, state, pNodeId);
        introsortUtil(arr, p + 1, end, depthLimit - 1, steps, state, pNodeId);
    }
    function getTimSortSteps(originalArray) {
        const arr = [...originalArray]; const steps = []; const state = { stepCounter: 0, comparisonCount: 0, swapCount: 0 };
        const n = arr.length, RUN = 32;
        steps.push({ id: state.stepCounter++, parentId: null, type: 'start', arrayState: [...arr], ...state, lineOfCode: 1 });
        const iNodeId = state.stepCounter;
        steps.push({ id: state.stepCounter++, parentId: 0, type: 'phase-insertion', arrayState: [...arr], ...state, lineOfCode: 2 });
        for (let i = 0; i < n; i += RUN) {
            const end = Math.min(i + RUN - 1, n - 1);
            for (let j = i + 1; j <= end; j++) { let key = arr[j], k = j - 1; while (k >= i && arr[k] > key) { state.comparisonCount++; state.swapCount++; arr[k + 1] = arr[k--]; } arr[k + 1] = key; }
        }
        const mNodeId = state.stepCounter;
        steps.push({ id: state.stepCounter++, parentId: 0, type: 'phase-merge', arrayState: [...arr], ...state, lineOfCode: 4 });
        for (let size = RUN; size < n; size = 2 * size) {
            for (let left = 0; left < n; left += 2 * size) {
                let mid = left + size - 1, right = Math.min((left + 2 * size - 1), (n - 1));
                if (mid < right) merge(arr, left, mid, right, steps, state, mNodeId);
            }
        }
        steps.push({ id: state.stepCounter++, type: 'end', arrayState: [...arr], ...state, lineOfCode: 6 }); return steps;
    }
    
    function buildTreeFromSteps(steps) {
        if (!steps || steps.length === 0) return null;
        const nodes = new Map();
        steps.forEach(step => {
            nodes.set(step.id, { id: step.id, data: step, children: [] });
        });
        let root = null;
        steps.forEach(step => {
            if (step.parentId === null || !nodes.has(step.parentId)) {
                root = nodes.get(step.id);
            } else {
                const parentNode = nodes.get(step.parentId);
                if (parentNode) parentNode.children.push(nodes.get(step.id));
            }
        });
        return root;
    }
    
    function calculateInversions(arrayState) {
        const inversions = []; const n = arrayState.length;
        for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { inversions.push({ row: i, col: j, inversion: (i < j && arrayState[i] > arrayState[j]) }); } }
        return inversions;
    }

    let allSteps = {}, syncTimeline = [], animationInterval = null, currentSyncStep = 0, animationSpeed = 500;
    let focusedAlgorithm = null, lastHighlightedLine = null, interactiveController = null;
    const startBtn = document.getElementById('start-btn'), stepBtn = document.getElementById('step-btn'), resetBtn = document.getElementById('reset-btn'),
        speedSlider = document.getElementById('speed-slider'), arrayInput = document.getElementById('array-input');

    function initializeVisualization() {
        const isInteractive = document.getElementById('interactive-quicksort').checked;
        const selectedAlgos = Array.from(document.querySelectorAll('#algorithm-selection input:checked')).map(cb => cb.value);
        if (isInteractive) {
            if (!selectedAlgos.includes('quickSort')) { alert("Please select the 'QuickSort' algorithm to make it interactive."); document.getElementById('interactive-quicksort').checked = false; return; }
            if (selectedAlgos.length > 1) { alert("Interactive mode only works with QuickSort selected alone. Unselecting other algorithms."); document.querySelectorAll('#algorithm-selection input:checked').forEach(cb => { if (cb.value !== 'quickSort') cb.checked = false; }); return; }
            initializeInteractiveMode();
        } else {
            initializeSyncMode();
        }
    }

    function initializeSyncMode() {
        const inputArray = arrayInput.value.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
        if (inputArray.length < 2) { alert("Please enter at least two numbers."); return; }
        resetVisualization();
        const selectedAlgos = Array.from(document.querySelectorAll('#algorithm-selection input:checked')).map(cb => cb.value);
        if (selectedAlgos.length === 0) { alert("Please select at least one algorithm."); return; }
        selectedAlgos.forEach(algo => {
            const arrCopy = [...inputArray];
            switch (algo) {
                case 'bubbleSort': allSteps[algo] = getBubbleSortSteps(arrCopy); break;
                case 'selectionSort': allSteps[algo] = getSelectionSortSteps(arrCopy); break;
                case 'insertionSort': allSteps[algo] = getInsertionSortSteps(arrCopy); break;
                case 'shellSort': allSteps[algo] = getShellSortSteps(arrCopy); break;
                case 'heapSort': allSteps[algo] = getHeapSortSteps(arrCopy); break;
                case 'mergeSort': allSteps[algo] = getMergeSortSteps(arrCopy); break;
                case 'quickSort': allSteps[algo] = getQuickSortSteps(arrCopy); break;
                case 'introSort': allSteps[algo] = getIntroSortSteps(arrCopy); break;
                case 'timSort': allSteps[algo] = getTimSortSteps(arrCopy); break;
            }
        });
        createVersusUI(selectedAlgos);
        createSyncTimeline(selectedAlgos);
        setupCostGraph(selectedAlgos);
        if (syncTimeline.length > 0) drawState(0);
    }

    function initializeInteractiveMode() {
        const inputArray = arrayInput.value.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
        if (inputArray.length < 2) { alert("Please enter at least two numbers."); return; }
        resetVisualization();
        interactiveController = new QuickSortController(inputArray);
        createVersusUI(['quickSort']);
        const firstStep = interactiveController.nextStep();
        drawSingleState('quickSort', firstStep);
    }
    
    function createSyncTimeline(selectedAlgorithms) {
        let maxComparisons = 0;
        selectedAlgorithms.forEach(algo => { if (allSteps[algo]) { const lastStep = allSteps[algo][allSteps[algo].length - 1]; if (lastStep.comparisonCount > maxComparisons) maxComparisons = lastStep.comparisonCount; } });
        for (let i = 0; i <= maxComparisons; i++) {
            const timelineEntry = {};
            selectedAlgorithms.forEach(algo => { timelineEntry[algo] = findStepIndexForComparison(allSteps[algo], i); });
            syncTimeline.push(timelineEntry);
        }
    }

    function findStepIndexForComparison(algoSteps, targetCount) {
        if (!algoSteps) return 0; let bestIndex = 0;
        for (let i = 0; i < algoSteps.length; i++) { if (algoSteps[i].comparisonCount <= targetCount) bestIndex = i; else break; }
        return bestIndex;
    }

    function createVersusUI(selectedAlgorithms) {
        const versusArea = document.getElementById('versus-area'); versusArea.innerHTML = '';
        focusedAlgorithm = selectedAlgorithms.length > 0 ? selectedAlgorithms[0] : null;
        selectedAlgorithms.forEach(algo => {
            const name = algo.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); const column = document.createElement('div');
            column.className = 'versus-column'; column.id = `versus-column-${algo}`;
            column.innerHTML = `<h2>${name}</h2><p>Comparisons: <span id="comparisons-count-${algo}">0</span> | Writes/Swaps: <span id="swaps-count-${algo}">0</span></p><div class="viz-row"><svg id="bar-container-${algo}"></svg><svg id="tree-container-${algo}"></svg></div><svg id="heatmap-container-${algo}" class="heatmap-svg"></svg>`;
            column.addEventListener('click', () => { focusedAlgorithm = algo; updateFocusUI(); updateCodeDisplay(); });
            versusArea.appendChild(column);
        });
        updateFocusUI(); updateCodeDisplay();
    }
    function updateFocusUI() {
        document.querySelectorAll('.versus-column').forEach(col => col.classList.remove('focused-column'));
        if (focusedAlgorithm) document.getElementById(`versus-column-${focusedAlgorithm}`)?.classList.add('focused-column');
    }
    function updateCodeDisplay() {
        const codeDisplay = document.getElementById('code-display'), focusedAlgoNameSpan = document.getElementById('focused-algo-name');
        codeDisplay.innerHTML = ''; lastHighlightedLine = null;
        if (focusedAlgorithm && ALGO_CODE[focusedAlgorithm]) {
            const name = focusedAlgorithm.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            focusedAlgoNameSpan.textContent = `(${name})`;
            ALGO_CODE[focusedAlgorithm].forEach((line, index) => {
                const lineSpan = document.createElement('span'); lineSpan.id = `code-line-${index + 1}`; lineSpan.textContent = line; codeDisplay.appendChild(lineSpan);
            });
        } else { focusedAlgoNameSpan.textContent = ''; codeDisplay.textContent = 'Select an algorithm to see its code.'; }
    }
    function drawState(syncStepIndex) {
        if (syncStepIndex >= syncTimeline.length) return;
        const timelineEntry = syncTimeline[syncStepIndex]; const selectedAlgorithms = Object.keys(allSteps);
        if (lastHighlightedLine) lastHighlightedLine.classList.remove('highlighted-line');
        selectedAlgorithms.forEach(algo => {
            const stepIndex = timelineEntry[algo]; const step = allSteps[algo][stepIndex];
            drawSingleState(algo, step);
        });
        drawCostGraph(syncStepIndex);
    }
    function drawSingleState(algo, step) {
        if (!step) return;
        document.getElementById(`comparisons-count-${algo}`).textContent = step.comparisonCount;
        document.getElementById(`swaps-count-${algo}`).textContent = step.swapCount;
        drawBarChart(algo, step);
        drawTree(algo, step);
        drawInversionHeatmap(algo, step);
        if (algo === focusedAlgorithm && step.lineOfCode) {
            const lineToHighlight = document.getElementById(`code-line-${step.lineOfCode}`);
            if (lineToHighlight) { lineToHighlight.classList.add('highlighted-line'); lastHighlightedLine = lineToHighlight; }
        }
        if (step.type === 'await-pivot') enablePivotSelection(step.indices);
    }
    function enablePivotSelection(range) {
        const [low, high] = range; const bars = d3.select('#bar-container-quickSort').selectAll('.bar').nodes();
        for (let i = low; i <= high; i++) {
            const bar = d3.select(bars[i]); bar.classed('pivot-candidate', true);
            bar.on('click.pivot', function() {
                d3.select('#bar-container-quickSort').selectAll('.bar').classed('pivot-candidate', false).on('click.pivot', null);
                interactiveController.setPivotAndContinue(i);
                doStep();
            });
        }
    }
    function drawBarChart(algo, step) {
        const svg = d3.select(`#bar-container-${algo}`);
        const rect = svg.node().getBoundingClientRect();
        const width = rect.width, height = rect.height;
        if (width === 0) return;
        const margin = { top: 20, right: 5, bottom: 20, left: 5 };
        svg.selectAll('*').remove(); const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        const x = d3.scaleBand().range([0, width - margin.left - margin.right]).domain(d3.range(step.arrayState.length)).padding(0.1);
        const y = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]).domain([0, d3.max(step.arrayState) || 1]);
        g.selectAll('.bar').data(step.arrayState).enter().append('rect')
            .attr('class', (d, i) => `bar ${step.indices?.includes(i) ? (step.type.includes('compare') ? 'compared' : 'swapped') : ''}`)
            .attr('x', (d, i) => x(i)).attr('width', x.bandwidth()).attr('y', d => y(d)).attr('height', d => height - margin.top - margin.bottom - y(d));
        g.selectAll('.bar-label').data(step.arrayState).enter().append('text').attr('class', 'bar-label').attr('x', (d, i) => x(i) + x.bandwidth() / 2).attr('y', d => y(d) + 20).text(d => d);
    }
    function drawTree(algo, currentStep) {
        const svg = d3.select(`#tree-container-${algo}`);
        const rect = svg.node().getBoundingClientRect();
        const width = rect.width, height = rect.height;
        if (width === 0) return;
        const margin = { top: 40, right: 5, bottom: 40, left: 5 };
        svg.selectAll('*').remove(); const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        
        const stepSource = interactiveController && algo === 'quickSort' ? interactiveController.steps : allSteps[algo];
        if (!stepSource || stepSource.length === 0) return;

        const currentStepId = currentStep.id;

        const treeData = buildTreeFromSteps(stepSource); if (!treeData) return;
        const root = d3.hierarchy(treeData, d => d.children);
        const treeLayout = d3.tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom]); treeLayout(root);
        
        const nodes = root.descendants().filter(d => d.data.data.id <= currentStepId);
        const links = root.links().filter(d => d.target.data.data.id <= currentStepId);

        g.selectAll('.link').data(links).enter().append('path').attr('class', 'link').attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));
        const node = g.selectAll('.node').data(nodes, d => d.data.data.id).enter().append('g')
            .attr('class', d => `node ${d.data.data.id === currentStepId ? 'active-node' : ''}`).attr('transform', d => `translate(${d.x},${d.y})`);
        node.append('circle').attr('r', 8);
        node.append('text').text(d => d.data.data.type);
    }
    function drawInversionHeatmap(algo, step) {
        const svg = d3.select(`#heatmap-container-${algo}`);
        const rect = svg.node().getBoundingClientRect();
        const width = rect.width, height = rect.height;
        if (width === 0) return;
        svg.selectAll('*').remove(); const n = step.arrayState.length; if (n === 0) return;
        const heatmapData = calculateInversions(step.arrayState); const cellSize = Math.min(width / n, height / n);
        const g = svg.append('g').attr('transform', `translate(${(width - cellSize * n) / 2}, ${(height - cellSize * n) / 2})`);
        g.selectAll('.heatmap-cell').data(heatmapData).enter().append('rect')
            .attr('x', d => d.col * cellSize).attr('y', d => d.row * cellSize).attr('width', cellSize).attr('height', cellSize)
            .attr('class', d => `heatmap-cell ${d.inversion ? 'inversion' : 'no-inversion'}`);
    }
    let costGraphScales = {}, costGraphColors = d3.scaleOrdinal(d3.schemeCategory10);
    function setupCostGraph(selectedAlgorithms) {
        const svg = d3.select('#cost-graph-container');
        const rect = svg.node().getBoundingClientRect();
        const width = rect.width, height = rect.height;
        if (width === 0) return;
        const margin = { top: 20, right: 130, bottom: 40, left: 60 }; svg.selectAll('*').remove();
        const maxComparisons = syncTimeline.length > 1 ? syncTimeline.length - 1 : 1;
        const xScale = d3.scaleLinear().domain([0, maxComparisons]).range([margin.left, width - margin.right]);
        const yScale = d3.scaleLinear().domain([0, maxComparisons]).range([height - margin.bottom, margin.top]);
        costGraphScales = { x: xScale, y: yScale }; const g = svg.append('g');
        g.append('g').attr('class', 'axis axis--x').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(xScale));
        g.append('g').attr('class', 'axis axis--y').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(yScale));
        const legend = svg.selectAll(".graph-legend").data(selectedAlgorithms).enter().append("g")
            .attr("class", "graph-legend").attr("transform", (d, i) => `translate(${width - margin.right + 10},${margin.top + i * 20})`);
        legend.append("rect").attr("x", 0).attr("width", 18).attr("height", 18).style("fill", costGraphColors);
        legend.append("text").attr("x", 24).attr("y", 9).attr("dy", ".35em").text(d => d.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
    }
    function drawCostGraph(syncStepIndex) {
        const svg = d3.select('#cost-graph-container'); const { x, y } = costGraphScales; if (!x || !y) return;
        const selectedAlgorithms = Object.keys(allSteps);
        const lineGenerator = d3.line().x((d, i) => x(i)).y(d => y(d.comparisonCount));
        selectedAlgorithms.forEach(algo => {
            const dataForLine = syncTimeline.slice(0, syncStepIndex + 1).map(entry => allSteps[algo][entry[algo]]);
            let path = svg.selectAll(`.line-${algo}`).data([dataForLine]);
            path.enter().append('path').attr('class', `line line-${algo}`).style('stroke', costGraphColors(algo)).attr('d', lineGenerator)
              .merge(path).transition().duration(animationSpeed / 2).attr('d', lineGenerator);
        });
    }

    function startAnimation() {
        if (animationInterval) return;
        const isInteractive = document.getElementById('interactive-quicksort').checked;
        if (isInteractive) {
            if (!interactiveController) initializeInteractiveMode();
            animationInterval = setInterval(() => {
                const step = interactiveController.nextStep();
                if (!step || step.type === 'await-pivot' || step.type === 'end') { stopAnimation(); if (step) drawSingleState('quickSort', step); }
                else { drawSingleState('quickSort', step); }
            }, animationSpeed);
        } else {
            if (syncTimeline.length === 0 || currentSyncStep >= syncTimeline.length - 1) initializeSyncMode();
            animationInterval = setInterval(() => {
                if (currentSyncStep >= syncTimeline.length - 1) { stopAnimation(); return; }
                currentSyncStep++; drawState(currentSyncStep);
            }, animationSpeed);
        }
    }
    function doStep() {
        stopAnimation();
        const isInteractive = document.getElementById('interactive-quicksort').checked;
        if (isInteractive) {
            if (!interactiveController) initializeInteractiveMode();
            const step = interactiveController.nextStep(); if (step) drawSingleState('quickSort', step);
        } else {
            if (syncTimeline.length === 0) initializeSyncMode();
            if (currentSyncStep < syncTimeline.length - 1) { currentSyncStep++; drawState(currentSyncStep); }
        }
    }
    function stopAnimation() { clearInterval(animationInterval); animationInterval = null; }
    function resetVisualization() {
        stopAnimation(); currentSyncStep = 0; allSteps = {}; syncTimeline = []; interactiveController = null;
        focusedAlgorithm = null; lastHighlightedLine = null;
        document.getElementById('versus-area').innerHTML = '';
        d3.select('#cost-graph-container').selectAll('*').remove();
        updateCodeDisplay();
    }
    
    const scenarioNearlySortedBtn = document.getElementById('scenario-nearly-sorted');
    const scenarioReversedBtn = document.getElementById('scenario-reversed');
    const scenarioFewUniqueBtn = document.getElementById('scenario-few-unique');
    const currentArrayInput = document.getElementById('array-input');
    function generateAndReset(generator) {
        const size = currentArrayInput.value.split(',').filter(s => s.trim() !== "").length || 10;
        const newArray = generator(size);
        currentArrayInput.value = newArray.join(',');
        initializeVisualization();
    }
    startBtn.addEventListener('click', startAnimation);
    stepBtn.addEventListener('click', doStep);
    resetBtn.addEventListener('click', resetVisualization);
    speedSlider.addEventListener('input', e => {
        animationSpeed = 2050 - e.target.value;
        if (animationInterval) { stopAnimation(); startAnimation(); }
    });
    scenarioNearlySortedBtn.addEventListener('click', () => generateAndReset(generateNearlySorted));
    scenarioReversedBtn.addEventListener('click', () => generateAndReset(generateReversed));
    scenarioFewUniqueBtn.addEventListener('click', () => generateAndReset(generateFewUnique));

    initializeVisualization();
});