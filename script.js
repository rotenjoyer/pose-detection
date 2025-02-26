const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    await new Promise(resolve => videoElement.onloadedmetadata = resolve);
    videoElement.play();
}

async function loadPoseModel() {
    const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true });
    pose.onResults(drawResults);

    async function detectPose() {
        await pose.send({ image: videoElement });
        requestAnimationFrame(detectPose);
    }

    detectPose();
}

function drawResults(results) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
        // Draw landmarks (dots)
        for (let landmark of results.poseLandmarks) {
            canvasCtx.beginPath();
            canvasCtx.arc(landmark.x * canvasElement.width, landmark.y * canvasElement.height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'red';
            canvasCtx.fill();
        }

        const POSE_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
            [9, 10], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27],
            [26, 28], [27, 29], [28, 30], [29, 31], [30, 32]
        ];

        // Draw pose connections (lines)
        for (let [start, end] of POSE_CONNECTIONS) {
            const startLandmark = results.poseLandmarks[start];
            const endLandmark = results.poseLandmarks[end];

            if (startLandmark && endLandmark) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(startLandmark.x * canvasElement.width, startLandmark.y * canvasElement.height);
                canvasCtx.lineTo(endLandmark.x * canvasElement.width, endLandmark.y * canvasElement.height);
                canvasCtx.strokeStyle = 'lime';
                canvasCtx.lineWidth = 2;
                canvasCtx.stroke();
            }
        }
    }
}

setupCamera().then(loadPoseModel);
