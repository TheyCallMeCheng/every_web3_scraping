const puppeteer = require("puppeteer");
const fs = require("fs/promises")

async function start(url){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const names = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("    body > main > div > div > div > div:nth-child(3) > table > tbody"))
                   .map(x => x.textContent)
    })

    const title = await page.$$eval("body > main > div > div > div > div:nth-child(3) > table > tbody", (text) => {
        return text.map(x => x.textContent)
    })


    await fs.writeFile("names.txt", title.join("\r"));
    console.log(title);
    browser.close();
}

start("https://web3.career/")