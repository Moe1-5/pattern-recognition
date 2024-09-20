import * as tf from "@tensorflow/tfjs";

function processDwellTimes(dwellTime) {
    const numAttempts = dwellTime.length;
    const numElements = dwellTime[0].length;

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

    return standardizedDwellTimes;
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

function processData(data) {
    const dwellTime = data.dwellTime;
    const elapsedspeed = data.elapsedspeed;

    const standardizedDwellTimes = processDwellTimes(dwellTime);
    const elapsedResults = calculateElapsed(elapsedspeed);

    const combinedFeatures = standardizedDwellTimes.map((dwell, index) => {
        return [...dwell, elapsedResults.meanVal, elapsedResults.minVal, elapsedResults.maxVal, elapsedResults.stdDev];
    });

    return {
        combinedFeatures,
    };
}

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

async function runPrediction(data) {
    const { combinedFeatures } = processData(data);

    const labels = data.dwellTime.map(() => 1);

    const { trainInputs, testInputs, trainLabels, testLabels } = splitData(combinedFeatures, labels);

    const model = createModel(trainInputs.shape[1]);

    await trainModel(model, trainInputs, trainLabels);

    await evaluateModel(model, testInputs, testLabels);

    const predictions = model.predict(testInputs);

    const predictionArray = await predictions.array();

    return predictionArray;
}


export default runPrediction


