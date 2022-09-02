const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const today = new Date()
const MS_PER_DAY = 1000 * 60 * 60 * 24;


function getDifferenceInDays(year, month, day) {
    //get month returns months between 0 to 11
    const correctMonth = parseInt(today.getMonth()) + 1;
    const utcToday = Date.UTC(today.getFullYear(), correctMonth.toString(), today.getDate())
    const utcPosted = Date.UTC(year, month, day)
    return Math.floor((utcPosted - utcToday)/MS_PER_DAY)
}

async function getWeb3Carrer(url){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    //take a screenshot of the page for debugging purposes
    await page.screenshot({
        path:"./screen.png",
        fullPage: true,
    })

    const partialDataExtraction = await page.$$eval
    ("body > main > div > div > div > div:nth-child(3) > table > tbody > tr + script", (text) => {
        // .replace is needed to remove all of the extra spacings \n but keep one to separate the lines
        return text.map(x => ("" +x.innerHTML).replace(/\n{2,}/gm, "\n"))
    })

    const applyLinks = await page.$$eval(
        // Get the last td of the row, contains the a element with the apply link
        "body > main > div > div > div > div:nth-child(3) > table > tbody > tr > td:last-child a", (el) => {
            return el.map(x => ({
                applyLink: x.href
            }))
        }
    )

    let i = -1;
    const completeJSON = partialDataExtraction.map(element => {
        i++;
        return Object.assign(JSON.parse(element), applyLinks[i])
    }); 

    const standardizedJSON = completeJSON.map(element => ({
        Job_title: element.title,
        Company: element.hiringOrganization.name,
        Location: element.jobLocation.addressCountry,
        Category: element.occupationalCategory,
        Contract_Type: element.employmentType,
        TimePosted: element.datePosted,
        applyLink: element.applyLink,
        logoSrc: ""
    }))
    
    // await fs.writeFile("web3Carrer.json", JSON.stringify(standardizedJSON));
    browser.close();
    return standardizedJSON;
} 

async function getRemote3(url){
    const browser = await puppeteer.launch({slowMo: 1000, headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({
        width: 1080,
        height: 4000,
      });

    //take a screenshot of the page for debugging purposes
    await page.screenshot({
        path:"./screen.png",
        fullPage: true,
    })

    const partialDataExtraction = await page.$$eval
    ("#odindex > div.bubble-element.RepeatingGroup.bubble-rg > div.bubble-element.GroupItem.bubble-r-container.flex > div > div > div:nth-child(1) > div.bubble-element.Group.bubble-r-container.flex ", (text) => {
        return text.map(x => 
            ({
                Job_title: x.querySelector(".column > div a").textContent,
                Company: x.querySelector("div:nth-child(1)").textContent, 
                Location:  x.querySelector(".column > div:nth-child(3)").textContent,
                Category: "",
                Contract_Type: "",
            }))
    })

    const extractedLogosSrc = await page.$$eval
    ("#odindex > div.bubble-element.RepeatingGroup.bubble-rg > div.bubble-element.GroupItem.bubble-r-container.flex.row > div > div > div:nth-child(1) > div.bubble-element.Image > img", (text) => {
        return text.map(x => 
            ({
                logoSrc: x.src
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
        return Object.assign(item, datesPosted[i], jobLinks[i], extractedLogosSrc[i])
    })

    console.log(completeJSON[0])

    // await fs.writeFile("remote3.json", JSON.stringify(completeJSON));
    browser.close();
    
    return completeJSON;
}

async function getCryptocurrencyjobs(url) {
    const browser = await puppeteer.launch({slowMo: 600, headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({
        width: 1080,
        height: 1920,
      });

    //take a screenshot of the page for debugging purposes
    await page.screenshot({
        path:"./screen.png",
        fullPage: true,
    })
    
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
                    applyLink: x.querySelector("h2 a").href,
                    logoSrc: x.querySelector("img").src
                }
                )
            ) 
        }
    )

    
    function removeOlderThanFiveDays(el) {
        let month = el.TimePosted.substring(5,7);
        let day = el.TimePosted.substring(8,10);
        let year = el.TimePosted.substring(0,4)

        const numberOfDaysDifference = getDifferenceInDays(year, month, day)
        
        if(numberOfDaysDifference < -5){
            console.log("Discard: " + day + "/" + month)
            return false;
        }
        return true;
    }

    const filteredExtractedDataArray = extractedDataArray.filter(removeOlderThanFiveDays)

    console.log(filteredExtractedDataArray[1]);
    //await fs.writeFile("cryptocurrenciesjobs.json", JSON.stringify(filteredExtractedDataArray));

    browser.close()

    return filteredExtractedDataArray;
}

async function getCryptoJobs(url) {
    const browser = await puppeteer.launch({slowMo: 250, headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({
        width: 1080,
        height: 1920,
      });

    //take a screenshot of the page for debugging purposes
    await page.screenshot({
        path:"./screen.png",
        fullPage: true,
    })

    const extractedDataArray = await page.$$eval(
        "#app > div > div > div.col-md-8.content-panel > div > div.panel-body > table > tbody > tr.job-entry ", row => {
            return row.map(x => (
                {
                    Job_title: x.querySelector("td > a > p").textContent,
                    Company:  x.querySelector("td > a > span").textContent,
                    Location: x.querySelectorAll("td > a > div > small > span")[2].textContent,
                    Category: x.querySelector("td > a > div > small > span").textContent,
                    Contract_Type: x.querySelectorAll("td > a > div > small > span")[1].textContent,
                    TimePosted: x.querySelector("td > small > div > span").textContent,
                    applyLink: x.querySelector("td > a").href,
                    logoSrc: x.querySelector("td > a > img").src
                }
            ))
        }
    )
    "#app > div > div > div.col-md-8.content-panel > div > div.panel-body > table > tbody > tr > td:nth-child(2) > a > p "
    console.log(extractedDataArray[0])
    //await fs.writeFile("cryptojobs.json", JSON.stringify(extractedDataArray));

    browser.close()
    return extractedDataArray;
}

async function callAndGlue(){
    //gets the data, joins the array and then prints them to a single file
    // const web3Carrer = await getWeb3Carrer("https://web3.career/?page=1")
    const remote3 = await getRemote3("https://remote3.co/web3-jobs/")
    const CryptoCJ = await getCryptocurrencyjobs("https://cryptocurrencyjobs.co/")
    const CJ = await getCryptoJobs("https://crypto.jobs/?page=1")

    let joinedCryptoJobs = []
    // Array.prototype.push.apply(joinedCryptoJobs, web3Carrer)
    Array.prototype.push.apply(joinedCryptoJobs, remote3)
    Array.prototype.push.apply(joinedCryptoJobs, CryptoCJ)
    Array.prototype.push.apply(joinedCryptoJobs, CJ)
    await fs.writeFile(__dirname + "/AllCryptoJobs.json", JSON.stringify(joinedCryptoJobs));
}


callAndGlue()