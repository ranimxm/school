function ImageInputChange(e) {
    const file = e.target.files[0];
    if (file) {
        const progressBar = document.querySelector('#progressBar');

        Tesseract.recognize(
            file,
            'eng',
            {
                logger: info => {
                    console.log(info);
                    if (info.status === 'recognizing text') {
                        const progress = (info.progress / 1) * 100;
                        progressBar.style.width = `${progress}%`;
                    }
                }
            }
        ).then(({ data: { text } }) => {
            console.log(text);

            const formData = new FormData();
            formData.append('image', file);

            const textInput = document.createElement('input');
            textInput.type = 'hidden';
            textInput.name = 'text';
            textInput.value = text;
            formData.append('text', text);

            const outputDiv = document.querySelector('#output');
            outputDiv.innerHTML = text;

            const uploadedImage = document.querySelector('#uploadedImage');
            uploadedImage.src = URL.createObjectURL(file);

            const form = document.querySelector('form');
            form.appendChild(textInput);

            fetch('/store-notes', {
                method: 'POST',
                body: formData,
            }).then(response => response.json())
                .then(data => {
                    console.log(data);
                })
                .catch(error => console.error(error));
        });
    }
}
document.querySelector('#imageInput').addEventListener('change', ImageInputChange);


function preprocessText(text) {
    const preprocessedText = text.split('')
        .filter(char => char.charCodeAt(0) >= 0 && char.charCodeAt(0) <= 127)
        .join('');
    return preprocessedText;
}

function displayAsPreformattedText(text) {
    const preprocessedText = preprocessText(text);
    return `
            <h2>Extracted Data:</h2>
            <input rows="4" name="text" cols="50" value="${preprocessedText}">
        
        `
}