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
        return text.map(x => //here
            ({
                Company: x.querySelector("div:nth-child(1)").textContent, 
                Job_title: x.querySelector(".column > div a").textContent,
                Location:  x.querySelector(".column > div:nth-child(3)").textContent,
                //TimePosted: x.querySelector(".row > div > div > div:nth-child(2) > div.bubble-element.Text").textContent
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
    const browser = await puppeteer.launch({slowMo: 500, headless: true});
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
                    // Can't seem to find the correct selector to get the contract type
                    // Contract_Type: x.querySelector("li > h4 > a").textContent,
                    // TimePosted: x.querySelector("div.inline-block.leading-loose.sm span").textContent
        })
        )
        }
    )
"#hits > div > div > ol > li:nth-child(1) > div > div.col-start-3.row-start-1.flex.items-baseline.justify-end.self-center.sm\:self-auto > div.inline-block.leading-loose.sm\:mr-4 > span"
"#hits > div > div > ol > li > div > div.col-start-1.sm\:col-start-2.col-end-2.sm\:col-end-4 > div > ul:nth-child(5) > li > h4 > a"
"#hits > div > div > ol > li:nth-child(2) > div > div.col-start-1.sm\:col-start-2.col-end-2.sm\:col-end-4 > div > ul:nth-child(5) > li:nth-child(1) > h4 > a"
"#hits > div > div > ol > li:nth-child(3) > div > div.col-start-1.sm\:col-start-2.col-end-2.sm\:col-end-4 > div > ul:nth-child(5) > li > h4 > a"
"#hits > div > div > ol > li:nth-child(4) > div > div.col-start-1.sm\:col-start-2.col-end-2.sm\:col-end-4 > div > ul:nth-child(5) > li > h4 > a"
    console.log(extractedDataArray);
    browser.close()
}

getCryptocurrencyjobs("https://cryptocurrencyjobs.co/")
//getWeb3Carrer("https://web3.career/?page=1")
//getRemote3("https://remote3.co/web3-jobs/")