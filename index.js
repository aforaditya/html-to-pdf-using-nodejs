import fs from 'fs';
import path from 'path';
import util from 'util';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import express from 'express';
import archiver from 'archiver';
import excelToJS from './utils/getData.js'
import completeChallanData from './utils/completeChallanData.js'
import { fileURLToPath } from 'url';
import fileUpload from 'express-fileupload';
import { getCollection, set, deleteDoc } from './utils/db.js';
import bodyParser from 'body-parser';
import { get } from './utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = util.promisify(fs.readFile);
const app = express();

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({ limits: { fileSize: 100 * 1024 * 1024 } }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/pages');


// Define the temporary directory path
const tempDir = '/tmp';


var challans = []

async function getTemplateHtml() {
  console.log("Loading template file in memory");
  try {
    const invoicePath = path.resolve("./template2.html");
    return await readFile(invoicePath, 'utf8');
  } catch (err) {
    console.error("Could not load html template", err);
    throw err;
  }
}

function getDateTimeString() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0'); // Day of the month (zero-padded)
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = monthNames[now.getMonth()]; // Month abbreviation
  const year = now.getFullYear().toString().substr(-2); // Last two digits of the year
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${day}${month}${year}${hours}${minutes}${seconds}`;
}

async function generatePdf(challans, res) {

  
  try {
    const templateHtml = await getTemplateHtml();
    console.log("Compiling the template with handlebars");
    const template = handlebars.compile(templateHtml, { strict: true });
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (let i = 0; i < challans.length; i++) {
      const result = template(challans[i].challanData);
      const html = result;
      await page.setContent(html);
      // Specify the path within the /tmp directory
      const pdfPath = path.join(tempDir, `${challans[i].challanNumber}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A4' });
    }

    await browser.close();
    console.log("PDFs Generated");
    await zipAndSend(res);
    set('generatedChallans', getDateTimeString(), {
      dateTimeISO: new Date().toISOString(),
      challans: challans
    })

  } catch (err) {
    console.error("Error generating PDFs", err);
    res.status(500).send('Error generating PDFs: '+err);
  }
}

async function zipAndSend(res) {
  try {
    console.log("Zipping PDFs");
    const filesToZip = challans.map(c => `${c.challanNumber}.pdf`);
    const zipFileName = 'challan.zip';
    // Specify the path for the ZIP file within the /tmp directory
    const zipFilePath = path.join(tempDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    filesToZip.forEach((file) => {
      // Specify the path for each PDF file within the /tmp directory
      const pdfFilePath = path.join(tempDir, file);
      archive.file(pdfFilePath, { name: file });
    });

    archive.finalize();

    output.on('close', () => {
      console.log("Zipped");
      // Save Log
      res.download(zipFilePath, (err) => {
        if (err) {
          console.error('Error downloading the ZIP file:', err);
          res.status(500).send('Error downloading the ZIP file');
        } else {
          console.log('ZIP file downloaded');
          // Delete the ZIP file and PDF files from the /tmp directory
          deleteFiles(filesToZip);
        }
      });
    });

  } catch (err) {
    console.error("Error zipping PDFs", err);
    res.status(500).send('Error zipping PDFs');
  }
}

function deleteFiles(files) {
  files.push('challan.zip')
  files.forEach((fileName) => {
    // Specify the path for each PDF file within the /tmp directory
    const filePath = path.join(tempDir, fileName);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting ${filePath}:`, err);
      } else {
        console.log(`${filePath} has been deleted.`);
      }
    });
  });
}


app.get('/', (req,res)=>{
  res.sendFile(__dirname+'/pages/home.html')
})


app.get('/generateFromExcel', (req,res)=>{
  res.sendFile(__dirname+'/pages/generateFromExcel.html')
})

app.get('/clients', async (req,res)=>{

  let clients = []

  let docs = await getCollection('client')
  docs.forEach((doc) => {
  clients.push(doc.data());
  })

  console.log(clients);

  res.render('clients', {clients: clients})
})


app.get('/clients/:gstNumber', async (req, res)=>{
  let gstNumber = req.params.gstNumber
  let clientData = await get('client', gstNumber)
  res.render('editClient', {clientData: clientData})
})


app.post('/generate', async (req, res) => {

  if (!req.files || !req.files.file) {
    return res.status(400).send('No files were uploaded.');
  }

  let file = req.files.file
  challans = await excelToJS(file.data)
  console.log(challans);
  challans = await completeChallanData(challans)
  console.log('Final data', JSON.stringify(challans));
  generatePdf(challans, res);
});


app.post('/client', async (req, res)=>{
    
    let data = req.body
    let gstNumber = data.GSTINNumber
    let clientData = data

    await set('client', gstNumber, clientData)
    res.json({success: true})

})

app.delete('/client/:gstNumber', async (req, res)=>{
  let gstNumber = req.params.gstNumber
  await deleteDoc('client', gstNumber)
  res.json({success: true})
})


app.get('/template', (req, res)=>{
    res.sendFile(__dirname+'/template2.html')
})


app.listen(process.env.PORT || 5000, () => {
  console.log('Server ON');
});
