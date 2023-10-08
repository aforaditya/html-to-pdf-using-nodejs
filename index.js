const fs = require('fs');
const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const express = require('express');
const archiver = require('archiver');

const readFile = util.promisify(fs.readFile);
const app = express();

async function getTemplateHtml() {
  console.log("Loading template file in memory");
  try {
    const invoicePath = path.resolve("./template.html");
    return await readFile(invoicePath, 'utf8');
  } catch (err) {
    console.error("Could not load html template", err);
    throw err;
  }
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
      await page.pdf({ path: `${challans[i].challanNumber}.pdf`, format: 'A4' });
    }

    await browser.close();
    console.log("PDFs Generated");
    zipAndSend(res);

  } catch (err) {
    console.error("Error generating PDFs", err);
    res.status(500).send('Error generating PDFs');
  }
}

async function zipAndSend(res) {
  try {
    console.log("Zipping PDFs");
    const filesToZip = challans.map(c => `${c.challanNumber}.pdf`);
    const zipFileName = 'challan.zip';
    const output = fs.createWriteStream(zipFileName);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    filesToZip.forEach((file) => {
      archive.file(file, { name: file });
    });

    archive.finalize();

    output.on('close', () => {
      console.log("Zipped");
      res.download(zipFileName, (err) => {
        if (err) {
          console.error('Error downloading the ZIP file:', err);
          res.status(500).send('Error downloading the ZIP file');
        } else {
          console.log('ZIP file downloaded');
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
    fs.unlink(fileName, (err) => {
      if (err) {
        console.error(`Error deleting ${fileName}:`, err);
      } else {
        console.log(`${fileName} has been deleted.`);
      }
    });
  });
}

let challans = [
    {
      challanNumber: 10011,
      challanData: {
        ContactPersonName: "John Doe",
        DeliveryChallanNumber: "CH10011",
        DeliveryChallanDate: "2023-10-08",
        ReceiverName: "Jane Smith",
        ConsigneeName: "ABC Company",
        ReceiverAddress: "123 Main St",
        SpokesPersonName: "Sam Brown",
        ConsigneeMobileNumber: "555-123-4567",
        ReceiverCity: "Cityville",
        ConsigneeAddress: "456 Oak St",
        ReceiverStateAndPin: "State A, 12345",
        ConsigneeCity: "Townsville",
        ConsigneeStateAndPin: "State B, 54321",
        GSTINNumber: "GSTIN12345",
        ShipToState: "State C",
        StateCode: "6789",
        PONumber: "PO-1001",
        ProductDescription: "Sample Product",
        HSNCode: "HSN-1234",
        MOQ: "10",
        Boxes: "5",
        Quantity: "50",
        UnitPrice: "$20",
        TotalAmount: "$1000",
        CGST: "$50",
        SGST: "$50",
        IGSTValue: "$0",
        IGST: "$0",
        Total: "$1100",
        TotalPreTax: "$1000",
      },
    },
  ];
  

app.get('/generate', async (req, res) => {
  generatePdf(challans, res);
});

app.listen(3000, () => {
  console.log('Server ON');
});
