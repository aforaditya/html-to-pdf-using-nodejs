import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'

const inputFile = 'excel.csv'; 


async function getData(file){

    let csvFilePath = path.join('/tmp', 'csvFile.csv')
    let data = []

    fs.writeFileSync(csvFilePath, file, (err) => {
    if (err) {
      console.error('Error saving CSV file:', err)
    } else {
      console.log('CSV file saved successfully.')
    }

   })

  await new Promise((resolve) => {
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        console.log();
        data.push(row);
      })
      .on('end', () => {
        resolve();
      });
  })

  return data
}






function transform(data){

  

  let usedIndex = []
  let transformedData = []

  data.forEach(item=>{

    let index = parseInt(Object.values(item)[0])-1

    const product = {
      ...item
    };

    product.TaxValue = (product.SGST * (product.Qty * product.UnitPrice))/100
    product.TaxValue+= (product.CGST * (product.Qty * product.UnitPrice))/100
    product.TotalAmount = (product.Qty * product.UnitPrice) + product.TaxValue 


     if(usedIndex.includes(index)){
      transformedData[index].Products.push(product)
     }else{
        usedIndex.push(index)
        transformedData.push({
          GSTINNumber: item.GSTINNumber,
          PONumber: item.PONumber,
          DispatchFrom: item.DispatchFrom,
          DeliveryChallanNumber: item.DeliveryChallanNumber,
          ConsigneeName: item.ConsigneeName,
          ContactPersonName: item.ContactPersonName,
          ConsigneeAddress: item.ConsigneeAddress,
          ConsigneeCity: item.ConsigneeCity,
          ConsigneeState: item.ConsigneeState,
          ConsigneePIN: item.ConsigneePIN,
          ConsigneeMobileNumber: item.ConsigneeMobileNumber,
          Products: [product]
        })
     }
  })

  console.log(transformedData);
  return transformedData

}
  

export default async function excelToJS(file){
  let parsedData = await getData(file)
  return transform(parsedData)
}

  