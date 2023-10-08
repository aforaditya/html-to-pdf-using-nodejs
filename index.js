const fs = require('fs')
const path = require('path')
const utils = require('util')
const puppeteer = require('puppeteer')
const hb = require('handlebars')
const readFile = utils.promisify(fs.readFile)
const express = require('express')
const app = express()
const archiver = require('archiver');

async function getTemplateHtml() {
console.log("Loading template file in memory")
try {
const invoicePath = path.resolve("./template.html");
return await readFile(invoicePath, 'utf8');
} catch (err) {
return Promise.reject("Could not load html template");
}
}


async function generatePdf(challans, resx) {


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
zip(resx)

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


filesToDelete.forEach((fileName) => {
  deleteFile(fileName);
});function deleteFile(fileName) {
    fs.unlink(fileName, (err) => {
      if (err) {
        console.error(`Error deleting ${fileName}:`, err);
      } else {
        console.log(`${fileName} has been deleted.`);
      }
    });
  }

async function zip(resx){

    console.log("Zipping")
    const filesToZip = challans.map(c=> `${c.challanNumber}.pdf`)
    console.log(filesToZip);

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
        function deleteFile(fileName) {
            fs.unlink(fileName, (err) => {
              if (err) {
                console.error(`Error deleting ${fileName}:`, err);
              } else {
                console.log(`${fileName} has been deleted.`);
              }
            });
          }
        setInterval(()=>sendZip(resx), 3000)
        
        
        
}


function sendZip(res){
    console.log('Sending');
    res.download('challan.zip', (err) => {
        if (err) {
          res.status(500).send('Error downloading the ZIP file');
        } else {
          // Delete the zip file after it has been sent
          fs.unlink('challan.zip', (unlinkError) => {
            if (unlinkError) {
              console.error('Error deleting ZIP file:', unlinkError);
            }
          });
        }
      });
}

function generate(res){
     generatePdf(challans, res);
     console.log('IN generate');
}

app.get('/generate', async (req, res)=>{
    generate(res)
})


app.listen(3000, ()=>console.log('Server ON'))


