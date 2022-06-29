const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


async function getWeb3Carrer(url){
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const partialDataExtraction = await page.$$eval
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

    partialDataExtraction.forEach(row => {
        //Just a test to check if I can access items in the object
        //console.log(JSON.parse(row).datePosted + " NEW LINE ------------------- \n")
        // I have to parse Each row to make sure the json is correctly formatted
        // Some strange errors might popup while parsing the json, we will just skip those lines
        try{
            //Instead of pushing to the array of objects you should use Object.assign to push directly to the object
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

    const partialDataExtraction = await page.$$eval
    ("#odindex > div.bubble-element.RepeatingGroup.bubble-rg > div.bubble-element.GroupItem.bubble-r-container.flex > div > div > div:nth-child(1) > div.bubble-element.Group.bubble-r-container.flex ", (text) => {
        return text.map(x => 
            ({
                Company: x.querySelector("div:nth-child(1)").textContent, 
                Job_title: x.querySelector(".column > div a").textContent,
                Location:  x.querySelector(".column > div:nth-child(3)").textContent,
            }))
    })
    
    // TODO: Change the "2 days ago" to actual time
    const datesPosted = await page.$$eval(
        "#odindex > div.bubble-element.RepeatingGroup.bubble-rg > div.bubble-element.GroupItem.bubble-r-container.flex.row > div > div > div:nth-child(2) > div.bubble-element.Text", (item) => {
            return item.map(x => ({
                TimePosted: x.textContent
            }))
        }
    )

    const jobLinks = await page.$$eval(
        "#odindex > div.bubble-element.RepeatingGroup.bubble-rg > div.bubble-element.GroupItem.bubble-r-container.flex.row > div > div > div:nth-child(1) > div.bubble-element.Group.bubble-r-container.flex.column > a", (linkItem) => {
            return linkItem.map(x => ({
                applyLink: x.href
            }))
        }
    )

    var i = -1;
    const completeJSON = partialDataExtraction.map(item => {
        i++;
        return Object.assign(item, datesPosted[i], jobLinks[i])
    })

    console.log(completeJSON)

    await fs.writeFile("remote3.json", JSON.stringify(completeJSON));
    browser.close();
    
}

async function getCryptocurrencyjobs(url) {
    const browser = await puppeteer.launch({slowMo: 100, headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({
        width: 1080,
        height: 1920,
      });
    
    const extractedDataArray = await page.$$eval(
        "#hits > div > div > ol > li", (row) => {
            return row.map(x => (
                {
                    Job_title: x.querySelector("h2").textContent,
                    Company:  x.querySelector("h3") .textContent,
                    Location: x.querySelector("li > h4 > a").textContent,
                    Category: x.querySelector("div > h4 > a").textContent,
                    Contract_Type: x.querySelectorAll(" div > div > ul ")[1].textContent,
                    TimePosted: x.querySelector("time").dateTime,
                }
                )
            ) 
        }
    )
    // Missing apply link
    console.log(extractedDataArray[1]);
    await fs.writeFile("cryptocurrenciesjobs.json", JSON.stringify(extractedDataArray));

    browser.close()
}



//getCryptocurrencyjobs("https://cryptocurrencyjobs.co/")
//getWeb3Carrer("https://web3.career/?page=1")
//getRemote3("https://remote3.co/web3-jobs/")