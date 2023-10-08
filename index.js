const fs = require('fs')
const path = require('path')
const utils = require('util')
const puppeteer = require('puppeteer')
const hb = require('handlebars')
const readFile = utils.promisify(fs.readFile)
const express = require('express')
const app = express()
const archiver = require('archiver');
const { download } = require('express/lib/response')

async function getTemplateHtml() {
console.log("Loading template file in memory")
try {
const invoicePath = path.resolve("./template.html");
return await readFile(invoicePath, 'utf8');
} catch (err) {
return Promise.reject("Could not load html template");
}
}


async function generatePdf(challans) {


getTemplateHtml().then(async (res) => {
// Now we have the html code of our template in res object
// you can check by logging it on console
// console.log(res)
console.log("Compiing the template with handlebars")
const template = hb.compile(res, { strict: true });
// we are using headless mode
const browser = await puppeteer.launch();
const page = await browser.newPage()


for(let i=0; i<challans.length; i++){
    // we have compile our code with handlebars
    const result = template(challans[i]['challanData']);
    // We can use this to add dyamic data to our handlebas template at run time from database or API as per need. you can read the official doc to learn more https://handlebarsjs.com/
    const html = result;
    // We set the page content as the generated html by handlebars
    await page.setContent(html)
    // We use pdf function to generate the pdf in the same folder as this file.
    await page.pdf({ path: `${challans[i]['challanNumber']}.pdf`, format: 'A4' })
}


await browser.close();
console.log("PDF Generated")
}).catch(err => {
console.error(err)
});
}


let challans = [
    {
        challanNumber: 2,
        challanData: {}
    },
    {
        challanNumber: 1,
        challanData: {}
    }
]

function zip(){
    const filesToZip = [
        '1.pdf',
        '2.pdf'
      ];

            // Create a ZIP archive
        const zipFileName = 'challan.zip';
        const output = fs.createWriteStream(zipFileName);
        const archive = archiver('zip', {
        zlib: { level: 9 }, // Compression level (0-9)
        });

        // Pipe the archive to the output file
        archive.pipe(output);

        // Add files to the archive
        filesToZip.forEach((file) => {
        archive.file(file, { name: file });
        });

        // Finalize the archive
        archive.finalize();
}


function sendZip(res){
    res.download('challan.zip', (err) => {
        if (err) {
          res.status(500).send('Error downloading the ZIP file');
        } else {
          // Delete the zip file after it has been sent
          fs.unlink(zipFileName, (unlinkError) => {
            if (unlinkError) {
              console.error('Error deleting ZIP file:', unlinkError);
            }
          });
        }
      });
}

app.get('/generate', async (req, res)=>{
    await generatePdf(challans);
    zip()
    sendZip(res)
})


app.listen(3000, ()=>console.log('Server ON'))
