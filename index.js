const express =  require('express')
const axios  = require ('axios')
const cheerio =  require('cheerio')
const PORT = process.env.PORT|| 8080
const app = express()


const sortMap = new Map();
sortMap.set(1,'DISTANCE');
sortMap.set(2,'PRICE_AMOUNT');
sortMap.set(3,'SORTING_DATE');

const AXIOS_OPTIONS = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/539.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A",
    },
  };
      app.get('/search/:searchId/:catId/:sortId/:cityId/:plzId/:radiusId/:maxId/:minid/:pagesId', (req,res) => {
        const KEYWORD =  req.params.searchId;
        const CITY = req.params.cityId
        const PLZ = req.params.plzId
        const CAT = req.params.catId
        const RADIUS = req.params.radiusId
        const MAX= req.params.maxId
        const MIN= req.params.minid
        const PAGES = req.params.pagesId
        const SORTING = sortMap.get(req.params.sortId);

        
   var x = getLinks(`https://www.ebay-kleinanzeigen.de/s-suchanfrage.html?keywords=${KEYWORD}&categoryId=${CAT}&locationStr=${PLZ}+${CITY}&locationId=&radius=${RADIUS}&sortingField=${SORTING}&adType=&posterType=&pageNum${PAGES}=&action=find&maxPrice=${MAX}&minPrice=${MIN}`,PAGES)
   .then(getData)
   .then((promises) => Promise.all(promises))
   .then(response => res.json(response))
   .catch((e) => {
    console.log(e);
    process.exit(1);});
}
)
app.listen(PORT,()=> console.log(`Server Started at Port ${PORT}`))
function getLinks(MAIN_URL,Pg) {
    return axios.get(MAIN_URL,AXIOS_OPTIONS).then(function ({ data }) {
      let $ = cheerio.load(data);
      const links = [];
      links[0] = MAIN_URL
      $('.pagination-pages',data).each(function (m,el) {
        
        for(var i  = 2 ; i <= Pg ; i++){
           links[i -1] =  getURL($,this,i)
          }
        }
      );
  
      return links;
    });
  }

  function getURL ($,html,i){
    try{   
        var ux ='https://www.ebay-kleinanzeigen.de'+ $(html).find('a:nth-child'+'('+i+')').prop('href')
        return ux

    }catch(e){
        console.log("Fehler getURL => " + e)
    }
}

function getData(url2){   
      return url2.map((url, i) => {
        const articles = []  
        return axios.get(url).then(function ({ data }) { 
            let $ = cheerio.load(data);
                     $('.aditem',data).each( function(){
                         const title = $(this).find('a.ellipsis').text().replaceAll('\n',"").trim();
                         const link ='https://www.ebay-kleinanzeigen.de' + $(this).find('div.aditem-image').find('a').attr('href');
                         const ort =  $(this).find('div.aditem-main--top--left').text().replaceAll('\n',"").trim().replace(/[\t ]+/g, " ")
                         const price = $(this).find('div.aditem-main--middle--price-shipping').find('p').text().replaceAll('\n',"").trim().replace(/[\t ]+/g, " ")
                         const img =  $(this).find('div.aditem-image > a > div').attr('data-imgsrc');
                         articles.push({
                             title,
                             link,
                             ort,
                             price,
                             img
                         })
                     })
                     return articles;
                 }).catch(err => console.log(err))
             } 
      )}