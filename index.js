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
zip()

}).catch(err => {
console.error(err)
});
}


let challans = [
    {
        challanNumber: 10011,
        challanData: {
            "ContactPersonName": "Dummy Value",
            "DeliveryChallanNumber": "Dummy Value",
            "DeliveryChallanDate": "Dummy Value",
            "ReceiverName": "Dummy Value",
            "ConsigneeName": "Dummy Value",
            "ReceiverAddress": "Dummy Value",
            "SpokesPersonName": "Dummy Value",
            "ConsigneeMobileNumber": "Dummy Value",
            "ReceiverCity": "Dummy Value",
            "ConsigneeAddress": "Dummy Value",
            "ReceiverStateAndPin": "Dummy Value",
            "ConsigneeCity": "Dummy Value",
            "ConsigneeStateAndPin": "Dummy Value",
            "GSTINNumber": "Dummy Value",
            "ShipToState": "Dummy Value",
            "StateCode": "Dummy Value",
            "PONumber": "Dummy Value",
            "ProductDescription": "Dummy Value",
            "HSNCode": "Dummy Value",
            "MOQ": "Dummy Value",
            "Boxes": "Dummy Value",
            "Quantity": "Dummy Value",
            "UnitPrice": "Dummy Value",
            "TotalAmount": "Dummy Value",
            "CGST": "Dummy Value",
            "SGST": "Dummy Value",
            "IGSTValue": "Dummy Value",
            "IGST": "Dummy Value",
            "Total": "Dummy Value",
            "TotalPreTax": "Dummy",
          }          
    }
]

function zip(){
    console.log("Zipping")
    const filesToZip = challans.map(c=>c.challanNumber)

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
        console.log("Zipped")
        
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


async function generate(res){
    await generatePdf(challans);
    sendZip(res)
}

app.get('/generate', async (req, res)=>{
    generate(res)
})


app.listen(3000, ()=>console.log('Server ON'))


