import tf from 'tensorflow'

function processDwellTimes(dwellTime) {
    const numAttempts = dwellTime.length;        // Number of login attempts
    const numElements = dwellTime[0].length;     // Number of key positions (elements)

    // Initialize arrays to hold sums, min, max, means, variances, and standard deviations
    const sumVals = new Array(numElements).fill(0);
    const meanVals = new Array(numElements).fill(0);
    const minVals = new Array(numElements).fill(Infinity);
    const maxVals = new Array(numElements).fill(-Infinity);
    const varianceVals = new Array(numElements).fill(0);
    const stdDevs = new Array(numElements).fill(0);

    // Step 1: Calculate sums, min, and max for each position
    for (let i = 0; i < numAttempts; i++) {
        for (let j = 0; j < numElements; j++) {
            const value = dwellTime[i][j];
            sumVals[j] += value;
            if (value < minVals[j]) minVals[j] = value;
            if (value > maxVals[j]) maxVals[j] = value;
        }
    }

    // Step 2: Calculate means
    for (let j = 0; j < numElements; j++) {
        meanVals[j] = sumVals[j] / numAttempts;
    }

    // Step 3: Calculate variance and standard deviation
    for (let i = 0; i < numAttempts; i++) {
        for (let j = 0; j < numElements; j++) {
            const value = dwellTime[i][j];
            varianceVals[j] += Math.pow(value - meanVals[j], 2);
        }
    }

    for (let j = 0; j < numElements; j++) {
        varianceVals[j] /= numAttempts;  // Variance
        stdDevs[j] = Math.sqrt(varianceVals[j]);  // Standard deviation
    }

    const standardizedDwellTimes = dwellTime.map(attempt =>
        attempt.map((value, j) => (value - meanVals[j]) / stdDevs[j])
    );


    console.log(`this is the mean Value : ${meanVals}\n
          and this is the minmum value : ${minVals}\n
          and this is the maximum value : ${maxVals}\n
           and this is the standard deviation : ${stdDevs}\n
           while the last one is the standardized dwell time : ${standardizedDwellTimes}`);
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

    const dwellTimeResults = processDwellTimes(dwellTime);
    const elapsedResults = calculateElapsed(elapsedspeed);

    // Optionally, use or return the results as needed
    return {
        dwellTimeResults,
        elapsedResults
    };
}
