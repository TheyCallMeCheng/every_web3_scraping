const puppeteer = require("puppeteer");
const fs = require("fs/promises");

async function start(url){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const table = await page.$$eval
    ("body > main > div > div > div > div:nth-child(3) > table > tbody > tr + script", (text) => {
        // .replace is needed to remove all of the extra spacings \n but keep one to separate the lines
        return text.map(x => ("" +x.innerHTML).replace(/\n{2,}/gm, "\n"))
    })

    const applyLinks = await page.$$eval(
        // Get the last td of the row, contains the a element with the apply link
        "body > main > div > div > div > div:nth-child(3) > table > tbody > tr > td:last-child a", (el) => {
            return el.map(x => x.href)
        }
    )

    console.log(applyLinks.length)

    let tempArray = new Array();
    //console.log(table.entries())

    table.forEach(row => {
        //Just a test to check if I can access items in the object
        //console.log(JSON.parse(row).datePosted + " NEW LINE ------------------- \n")
        // I have to parse Each row to make sure the json is correctly formatted
        tempArray.push(JSON.parse(row))
    });

    console.log(tempArray[0].datePosted)
    
    await fs.writeFile("names.json", JSON.stringify(tempArray));
    browser.close();
} 

start("https://web3.career/?page=1")