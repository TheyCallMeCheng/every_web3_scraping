const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


async function getWeb3Carrer(url){
    
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

    let tempArray = new Array();

    table.forEach(row => {
        //Just a test to check if I can access items in the object
        //console.log(JSON.parse(row).datePosted + " NEW LINE ------------------- \n")
        // I have to parse Each row to make sure the json is correctly formatted
        // Some strange errors might popup while parsing the json, we will just skip those lines
        try{
            applyLinks.forEach(element => {
                tempArray.push(JSON.parse(row), element) 
            });
        }catch(error) {
            console.log("Error while pushing to tempArray: " + error)
        }
    });

    //Delete unused data
    tempArray.forEach(element => {
        if(element.datePosted){
            delete element["@context"]
            delete element["@type"]
        }
    })
    
    await fs.writeFile("web3Carrer.json", JSON.stringify(tempArray));
    browser.close();
} 

async function getRemote3(url){
    const browser = await puppeteer.launch({slowMo: 1000, headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({
        width: 1080,
        height: 4000,
      });

    await page.screenshot({
        path:"./screen.png",
        fullPage: true,
    })
    
    const table = await page.$$eval
    ("#odindex > div.bubble-element.RepeatingGroup.bubble-rg > div.bubble-element.GroupItem", (text) => {
        return text.map(x => (x.innerHTML))
    })

    // console.log(table[0].textContent)
    
    const dom = new JSDOM(table[0])
    console.log(dom.window.document.querySelector(".bubble-element").textContentt)

    await fs.writeFile("remote3.txt", table);
    browser.close();
    
}


//getWeb3Carrer("https://web3.career/?page=1")
getRemote3("https://remote3.co/web3-jobs/")