import * as tf from "@tensorflow/tfjs";

// Step 1: Process Dwell Times (this code remains unchanged)
function processDwellTimes(dwellTime) {
    const numAttempts = dwellTime.length;        // Number of login attempts
    const numElements = dwellTime[0].length;     // Number of key positions (elements)

    const sumVals = new Array(numElements).fill(0);
    const meanVals = new Array(numElements).fill(0);
    const minVals = new Array(numElements).fill(Infinity);
    const maxVals = new Array(numElements).fill(-Infinity);
    const varianceVals = new Array(numElements).fill(0);
    const stdDevs = new Array(numElements).fill(0);

    for (let i = 0; i < numAttempts; i++) {
        for (let j = 0; j < numElements; j++) {
            const value = dwellTime[i][j];
            sumVals[j] += value;
            if (value < minVals[j]) minVals[j] = value;
            if (value > maxVals[j]) maxVals[j] = value;
        }
    }

    for (let j = 0; j < numElements; j++) {
        meanVals[j] = sumVals[j] / numAttempts;
    }

    for (let i = 0; i < numAttempts; i++) {
        for (let j = 0; j < numElements; j++) {
            const value = dwellTime[i][j];
            varianceVals[j] += Math.pow(value - meanVals[j], 2);
        }
    }

    for (let j = 0; j < numElements; j++) {
        varianceVals[j] /= numAttempts;
        stdDevs[j] = Math.sqrt(varianceVals[j]);
    }

    const standardizedDwellTimes = dwellTime.map(attempt =>
        attempt.map((value, j) => (value - meanVals[j]) / stdDevs[j])
    );

    console.log(`this is the mean Value : ${meanVals}\n
          and this is the minimum value : ${minVals}\n
          and this is the maximum value : ${maxVals}\n
           and this is the standard deviation : ${stdDevs}\n
           while the last one is the standardized dwell time : ${standardizedDwellTimes}`);

    return standardizedDwellTimes; // Return the standardized times for later use
}

function calculateElapsed(elapsed) {
    const sum = elapsed.reduce((a, b) => a + b, 0);
    const meanVal = sum / elapsed.length;
    const minVal = Math.min(...elapsed);
    const maxVal = Math.max(...elapsed);

    const variance = elapsed.reduce((acc, value) => acc + Math.pow(value - meanVal, 2), 0) / elapsed.length;
    const stdDev = Math.sqrt(variance);

    return { meanVal, minVal, maxVal, stdDev };
}

export default function processData(data) {
    const dwellTime = data.dwellTime;
    const elapsedspeed = data.elapsedspeed;

    const standardizedDwellTimes = processDwellTimes(dwellTime);  // Preprocessing
    const elapsedResults = calculateElapsed(elapsedspeed);

    return {
        standardizedDwellTimes,  // Return standardized dwell times for training
        elapsedResults
    };
}

// Step 2: Splitting data into training and testing
function splitData(inputData, labels, testSize = 0.2) {
    const numSamples = inputData.length;
    const testCount = Math.floor(numSamples * testSize);

    const shuffledIndices = tf.util.createShuffledIndices(numSamples);
    const trainInputs = [];
    const testInputs = [];
    const trainLabels = [];
    const testLabels = [];

    for (let i = 0; i < numSamples; i++) {
        if (i < testCount) {
            testInputs.push(inputData[shuffledIndices[i]]);
            testLabels.push(labels[shuffledIndices[i]]);
        } else {
            trainInputs.push(inputData[shuffledIndices[i]]);
            trainLabels.push(labels[shuffledIndices[i]]);
        }
    }

    return {
        trainInputs: tf.tensor2d(trainInputs),
        testInputs: tf.tensor2d(testInputs),
        trainLabels: tf.tensor2d(trainLabels, [trainLabels.length, 1]),
        testLabels: tf.tensor2d(testLabels, [testLabels.length, 1])
    };
}

// Step 3: Model creation and training
function createModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));  // Output layer for binary classification
    return model;
}

async function trainModel(model, trainInputs, trainLabels) {
    model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainInputs, trainLabels, {
        epochs: 50,
        batchSize: 10,
        shuffle: true
    });

    console.log("Model training complete");
}

async function evaluateModel(model, testInputs, testLabels) {
    const result = await model.evaluate(testInputs, testLabels);
    console.log(`Test loss: ${result[0].dataSync()}`);
    console.log(`Test accuracy: ${result[1].dataSync()}`);
}

// Step 4: Putting it all together
export function runTrainingPipeline(data) {
    const { standardizedDwellTimes } = processData(data);  // Get preprocessed data

    // Define labels for classification (1 = valid, 0 = invalid). Adjust this according to your dataset.
    const labels = [1, 0, 1, 0, 1];  // Example labels, should match the size of the data

    const { trainInputs, testInputs, trainLabels, testLabels } = splitData(standardizedDwellTimes, labels);

    const model = createModel(trainInputs.shape[1]);  // Input shape is the number of features
    trainModel(model, trainInputs, trainLabels).then(() => {
        evaluateModel(model, testInputs, testLabels);
    });
}

