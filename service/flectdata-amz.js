const axios = require('axios');
const cherrio = require('cheerio');
const HttpsProxyAgent = require('https-proxy-agent')
var agentconst = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
    'Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (iPad; CPU OS 8_4_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12H321 Safari/600.1.4'];
async function getHTML(productURL) {
    var idx = Math.floor(Math.random() * 4);
    var agent = agentconst[idx];
    var proxy = new HttpsProxyAgent('http://9bWCnUw:3pEe1m66@193.36.231.126:57374');
    return new Promise(async (resolve, reject) => {
        const { data: html } = await axios.get(productURL, {
            headers: {
                'User-Agent': agent,
                'Accept-Language': 'en-US,en;q=0.8'
            },
            httpsAgent: proxy
        })
            .catch(function (error) {
                var product = {
                    err: error,
                    title: '',
                    price: '',
                    availability: ''
                };
                return reject(error);
            });
        const $ = cherrio.load(html);
        var product;
        if (productURL.includes('amazon')) {
            let title = $('#productTitle').text().replace(/\n/g, '');
            let image_list = [];
            let rs;
            $('script').each(function () {
                let text = this.children[0].data;

                if (text.includes('colorImages')) {
                    const inLine = text.replace(/\n/g, '');
                    const matchX = inLine.match(/var data = (.*);/);
                    rs = matchX[1]; // prints "{name: "Jeff"}"
                    //rs = rs.match(/'colorImages': { 'initial': (.*)},/)[1];
                    rs = rs.match(/'colorImages': { 'initial': (.*)}]},/)[1] + '}]';
                    //console.log(matchX);
                    return false;
                }
            });
            let priceElement = (($('#priceblock_ourprice') && $('#priceblock_ourprice').text() || $('#price_inside_buybox') && $('#price_inside_buybox').text()) || ($('#newBuyBoxPrice') && $('#newBuyBoxPrice').text()));
            let price = priceElement.replace(/\n/g, '').replace('$','');
            let availability = $('#availability').text().replace(/\n/g, '');
            if (availability && availability == 'In Stock.') {
                availability = '1';
            } else {
                availability = '0';
            }
            if (rs) {
                rs = JSON.parse(rs);
                // rs = rs.colorImages.initial;
                rs.forEach(element => {
                    var imgD = element.hiRes;
                    if (!imgD) imgD = element.large;
                    image_list.push(imgD);
                });
            }
            // let img = $('#main-image-container .imgTagWrapper').find('img').each(function() { 
            //     image_list.push(this.attribs.src);

            //  }); 
            let description = [];
            $('#feature-bullets').find('.a-list-item').each(function () {
                description.push(this.children[0].data.replace(/\n/g, ''));
            });
            // var product = [title,price,availability];
            product = {
                err: '',
                title: title,
                image_list: image_list,
                price: price,
                availability: availability,
                description: description
            };
        } else {
            let image_list = [];
            let rs;
            $('script').each(function () {
                if (this.children[0]) {

                    let text = this.children[0].data;
                    if (text.includes('"item":')) {

                        rs = text;
                        return false;
                    }
                }
            });
            if (rs) {
                rs = JSON.parse(rs);
                // rs = rs.colorImages.initial;
                if (rs.item && rs.item.product &&
                    rs.item.product.buyBox && rs.item.product.buyBox.products[0] && rs.item.product.buyBox.products[0].images) {
                    rs.item.product.buyBox.products[0].images.forEach(element => {
                        image_list.push(element.url);
                    });
                }

                //description
                var description = [rs.item.product.buyBox.products[0].detailedDescription];
                var asin = rs.item.product.buyBox.products[0].productId;
                var title = rs.item.product.buyBox.products[0].productName;
                var price = rs.item.product.buyBox.products[0].priceMap.price;
                var availability = rs.item.product.buyBox.products[0].availabilityStatus;
                if (availability && availability == 'IN_STOCK') {
                    availability = '1';
                } else {
                    availability = '0';
                }
            }
            product = {
                err: '',
                title: title,
                image_list: image_list,
                description: description,
                price: price,
                availability: availability,
                asin: asin
            };
        }
        return resolve(product);
    });
}

module.exports = getHTML;
