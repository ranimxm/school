const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
    destination: 'public/uploads',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });


const placeholderFolder = path.join(__dirname, 'data', 'placeholder');
if (!fs.existsSync(placeholderFolder)) {
    fs.mkdirSync(placeholderFolder);
    fs.writeFileSync(path.join(placeholderFolder, 'hh.txt'), 'This is a placeholder file.');
}

app.get('/', (req, res) => {
    const dataDirectory = path.join(__dirname, 'data');
    const projectNames = fs.readdirSync(dataDirectory).filter(name => name !== 'placeholder'); // Exclude the "placeholder" folder

    res.render('projects', { projectNames });
});

app.get('/project/:projectName', (req, res) => {
    const projectName = req.params.projectName;

    const textFilePath = path.join(__dirname, 'data', `${projectName}`, `text_data.json`);
    let textData = [];

    if (fs.existsSync(textFilePath)) {
        const textDataJson = fs.readFileSync(textFilePath, 'utf8');
        textData = JSON.parse(textDataJson);
    }

    const notesFilePath = path.join(__dirname, 'data', `${projectName}`, `notes_data.json`);
    let notesData = [];

    if (fs.existsSync(notesFilePath)) {
        const notesDataJson = fs.readFileSync(notesFilePath, 'utf8');
        notesData = JSON.parse(notesDataJson);
    }

    res.render('project_template', { projectName, textData, notesData });
});

app.post('/create-project', (req, res) => {
    const projectName = req.body.projectName;

    const folderPath = path.join(__dirname, 'data', `${projectName}`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    res.redirect(`/project/${projectName}`);
});


app.post('/process-choice', (req, res) => {
    const projectName = req.body.projectName;
    const choice = req.body.choice;

    if (choice === 'text') {
        res.redirect(`/project/${projectName}/text`);
    } else if (choice === 'notes') {
        res.redirect(`/project/${projectName}/notes`);
    } else {
        res.status(400).send('Invalid choice');
    }
});

app.get('/project/:projectName/text', (req, res) => {
    const projectName = req.params.projectName;
    let textData = [];
    const filePath = path.join(__dirname, 'data', `${projectName}`, `text_data.json`);

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        textData = JSON.parse(data);
    }

    res.render('audio_page', { projectName, textData });
});

app.get('/project/:projectName/notes', (req, res) => {
    const projectName = req.params.projectName;
    let notesData = [];
    const filePath = path.join(__dirname, 'data', `${projectName}`, `notes_data.json`);

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        notesData = JSON.parse(data);
    }

    res.render('img_page', { projectName, notesData });
});

app.post('/store-notes', upload.single('image'), (req, res) => {
    const projectName = req.body.projectName;
    const text = req.body.text;
    const imageFilePath = req.file.path;

    const folderPath = path.join(__dirname, 'data', projectName);
    const filePath = path.join(folderPath, 'notes_data.json');
    let notesData = [];
    let noteId = 1;

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');

        try {
            notesData = JSON.parse(data);
            if (notesData.length > 0) {
                const maxId = Math.max(...notesData.map(note => note.id));
                noteId = maxId + 1;
            }
        } catch (error) {
            console.error('error', error);
        }
    }

    const note = {
        id: noteId,
        image: imageFilePath,
        text: text,
        preview: text.substring(0, 10) + '...',
    };

    notesData.push(note);

    fs.writeFileSync(filePath, JSON.stringify(notesData));

    res.render('img_page', { projectName, text, imageFilePath });
});


app.post('/store-text', (req, res) => {
    const projectName = req.body.projectName;

    const text = req.body.text;
    const folderPath = path.join(__dirname, 'data', `${projectName}`);
    const filePath = path.join(folderPath, 'text_data.json');
    let textData = [];

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        textData = JSON.parse(data);
    }

    textData.push(text);

    fs.writeFileSync(filePath, JSON.stringify(textData));
    res.redirect(`/project/${projectName}/text`);
});

app.get('/project/:projectName/:itemType/:itemId', (req, res) => {
    const projectName = req.params.projectName;

    const itemType = req.params.itemType; 
    const itemId = req.params.itemId; 

    const folderPath = path.join(__dirname, 'data', `${projectName}`);
    const filePath = path.join(folderPath, `${itemType}_data.json`);

    let itemData = [];
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        itemData = JSON.parse(data);
    }
    const itemContent = itemData[itemId] || '';

    res.render('edit_item', { projectName, itemType, itemId, itemContent });
});

app.post('/edit-item', (req, res) => {
    const projectName = req.body.projectName;

    const itemType = req.body.itemType;
    const itemId = req.body.itemId;
    const updatedContent = req.body.updatedContent;

    const folderPath = path.join(__dirname, 'data', `${projectName}`);
    const filePath = path.join(folderPath, `${itemType}_data.json`);

    let itemData = [];
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        itemData = JSON.parse(data);
    }
    itemData[itemId] = updatedContent;

    fs.writeFileSync(filePath, JSON.stringify(itemData));

    res.redirect(`/project/${projectName}/${itemType}/${itemId}`);
});


// for images
app.get('/project/:projectName/notes/:noteId/edit', (req, res) => {
    const projectName = req.params.projectName;
    const noteId = req.params.noteId;

    const filePath = path.join(__dirname, 'data', projectName, 'notes_data.json');
    let notesData = [];

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        notesData = JSON.parse(data);
    }

    const noteToEdit = notesData.find((note) => note.id == noteId);
    

    if (noteToEdit) {
        // Fetch the image path from the note
        const imagePath = noteToEdit.image;

        // Render the template and pass the imagePath
        res.render('edit_note', { projectName, noteToEdit, imagePath });
    } else {
        res.send('Note not found');
    }
});

app.post('/update-note/:projectName/:noteId', (req, res) => {
    const projectName = req.params.projectName;
    const noteId = req.params.noteId;
    const updatedContent = req.body.updatedContent;

    const filePath = path.join(__dirname, 'data', projectName, 'notes_data.json');
    let notesData = [];

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        notesData = JSON.parse(data);
    }

    const noteToEdit = notesData.find((note) => note.id == noteId);

    if (noteToEdit) {
        noteToEdit.text = updatedContent;

        fs.writeFileSync(filePath, JSON.stringify(notesData), 'utf8');
        res.redirect(`/project/${projectName}/notes`);
    } else {
        res.send('Note not found');
    }
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});