puppeteer = require('puppeteer');
const fs = require("fs");
const seller = require("./secrets");
(async () => {

    let output = [];
    let cachedInventory = {};
    async function checkTheBay() {


        // Launch the browser and open a new blank page
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        // Navigate the page to a URL
        await page.goto(`https://www.ebay.com/sch/i.html?_ssn=${seller.seller}&_sop=10`);

        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        // Type into search box
        // await page.type('.search-box__input', 'automate beyond recorder');

        // Wait and click on first result
        await page.waitForSelector('.s-item');

        const data = await page.evaluate(() => {
            const titles = Array.from(document.querySelectorAll('.s-item .s-item__title span'));
            return titles.map(title => title.textContent);
        });
        let counter = 0;
        for (let title of data) {
            if (title == 'Shop on eBay') {
                continue;
            }
            // console.log(title);
            checkTitle(title);
            counter++;
        }
        console.log(counter);
        await browser.close();
    }


    function start() {
        // Promise.all(queries.map((query) => doSearch(query, 1))).then((res) => {
        //     console.log(res);
        // });
        checkTheBay().then(() => sendMessage())
    }
    function sendMessage() {
        if (output.length > 0) {
            console.log("New Items:");
            console.log(output);
        }
        else {
            console.log("No new items");
        }
    }

    function checkForSave() {
        try {
            return fs.existsSync("save.json");
        } catch (e) {
            console.log(e);
        }
    }
    function load() {
        if (checkForSave()) {
            try {
                let rawdata = fs.readFileSync("save.json");
                let localInfo = JSON.parse(rawdata);
                cachedInventory = localInfo;
            } catch (e) {
                console.log(e);
            } finally {
                start();
            }
        } else {
            save().then(() => start());
        }
    }
    async function save() {
        let data = JSON.stringify(cachedInventory);
        try {
            await fs.writeFileSync("save.json", data);
        } catch (e) {
            console.log(e);
        }
    }

    load();

    function checkTitle(title) {
        return new Promise((resolve, reject) => {
            let thisRef = null;

            if (cachedInventory.ebayTitles == undefined) {
                cachedInventory.ebayTitles = [];
            }

            for (let cached of cachedInventory.ebayTitles) {
                if (cached == title) {
                    thisRef = cached;
                }
            }
            if (thisRef == null) {
                cachedInventory.ebayTitles.push(title);
                thisRef = cachedInventory.ebayTitles[cachedInventory.ebayTitles.length - 1];

                output.push(title);

            }


            save();
            resolve();
        });
    }




})();