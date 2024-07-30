const video = document.createElement('video');
const canvasElement = document.createElement('canvas');
const canvas = canvasElement.getContext('2d');
let scanning = false;
let records = [];

document.getElementById('startButton').addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
        scanning = true;
        video.srcObject = stream;
        video.setAttribute('playsinline', true);
        video.play();
        requestAnimationFrame(tick);
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('stopButton').style.display = 'block';
    });
});

document.getElementById('stopButton').addEventListener('click', () => {
    scanning = false;
    video.srcObject.getTracks().forEach(track => track.stop());
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('stopButton').style.display = 'none';
});

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        if (code) {
            processQRCode(code.data);
        }
    }
    if (scanning) {
        requestAnimationFrame(tick);
    }
}

function processQRCode(data) {
    const [name, role, level, grade] = data.split(', ');
    const time = new Date().toLocaleTimeString();
    records.push({ name, role, level, grade, time });
    updateRecordTable();
    document.getElementById('downloadButton').style.display = 'block';
}

function updateRecordTable() {
    const recordBody = document.getElementById('recordBody');
    recordBody.innerHTML = '';
    records.sort((a, b) => a.name.split(' ').slice(-1)[0].localeCompare(b.name.split(' ').slice(-1)[0])).forEach(record => {
        const row = document.createElement('tr');
        Object.values(record).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        recordBody.appendChild(row);
    });
}

function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre,Rol,Nivel,Grado,Hora de Llegada\n";
    records.forEach(record => {
        const row = Object.values(record).join(",");
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "registro_llegadas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
